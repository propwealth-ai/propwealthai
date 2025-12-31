import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Briefcase,
  Crown,
  Shield,
  Hammer,
  DollarSign,
  Scale,
  Search as SearchIcon,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  team_role: string;
  avatar_url: string | null;
}

interface Invitation {
  id: string;
  email: string;
  name: string | null;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
}

const roleIcons: Record<string, React.ComponentType<any>> = {
  owner: Crown,
  admin: Shield,
  shark_agent: Briefcase,
  contractor: Hammer,
  lender: DollarSign,
  attorney: Scale,
  inspector: SearchIcon,
  member: Users,
};

const roleColors: Record<string, string> = {
  owner: 'bg-gradient-gold text-slate-900',
  admin: 'bg-primary/20 text-primary',
  shark_agent: 'bg-blue-500/20 text-blue-400',
  contractor: 'bg-orange-500/20 text-orange-400',
  lender: 'bg-green-500/20 text-green-400',
  attorney: 'bg-purple-500/20 text-purple-400',
  inspector: 'bg-cyan-500/20 text-cyan-400',
  member: 'bg-muted text-muted-foreground',
};

const Team: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviting, setInviting] = useState(false);

  const roles = [
    { value: 'shark_agent', label: t('role.shark_agent') },
    { value: 'contractor', label: t('role.contractor') },
    { value: 'lender', label: t('role.lender') },
    { value: 'attorney', label: t('role.attorney') },
    { value: 'inspector', label: t('role.inspector') },
    { value: 'member', label: t('role.member') },
  ];

  useEffect(() => {
    if (profile?.team_id) {
      fetchTeamData();
    }
  }, [profile?.team_id]);

  const fetchTeamData = async () => {
    if (!profile?.team_id) return;
    setLoading(true);

    // Fetch team members
    const { data: membersData } = await supabase
      .from('profiles')
      .select('id, email, full_name, team_role, avatar_url')
      .eq('team_id', profile.team_id);

    if (membersData) {
      setMembers(membersData);
    }

    // Fetch pending invitations
    const { data: invitationsData } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', profile.team_id)
      .is('accepted_at', null);

    if (invitationsData) {
      setInvitations(invitationsData as Invitation[]);
    }

    setLoading(false);
  };

  const handleInvite = async () => {
    if (!profile?.team_id || !inviteEmail) return;
    setInviting(true);

    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: profile.team_id,
        email: inviteEmail,
        name: inviteName || null,
        role: inviteRole as any,
        invited_by: profile.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('team.inviteSent'),
        description: `Magic link generated for ${inviteEmail}`,
      });
      
      // Log the magic link (in production, this would send an email)
      console.log('📧 INVITATION MAGIC LINK:', {
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
        link: `${window.location.origin}/invite?token=${data.token}`,
      });

      setDialogOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('member');
      fetchTeamData();
    }

    setInviting(false);
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({
      title: 'Link Copied!',
      description: 'Invitation link copied to clipboard',
    });
  };

  const isOwner = profile?.team_role === 'owner';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{t('team.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('team.subtitle')}</p>
        </div>
        
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-premium text-primary-foreground gap-2">
                <UserPlus className="w-4 h-4" />
                {t('team.addMember')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">{t('team.addMember')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('team.name')}
                  </label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="input-executive"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('team.email')} *
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-executive"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('team.role')}
                  </label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="input-executive">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviting}
                  className="w-full btn-premium text-primary-foreground"
                >
                  {inviting ? t('common.loading') : t('team.addMember')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Members */}
      <div className="glass-card p-6">
        <h2 className={cn("text-xl font-semibold text-foreground mb-6", isRTL && "text-right")}>
          Team Members ({members.length})
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary animate-pulse-glow"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('team.noMembers')}
            </h3>
            <p className="text-muted-foreground">{t('team.inviteFirst')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member, index) => {
              const RoleIcon = roleIcons[member.team_role] || Users;
              
              return (
                <div
                  key={member.id}
                  className={cn(
                    "p-4 bg-secondary/50 rounded-lg animate-fade-in",
                    isRTL && "text-right"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                    <div className="team-avatar flex items-center justify-center bg-secondary">
                      <span className="text-lg font-bold text-foreground">
                        {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {member.full_name || 'Team Member'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.email}
                      </p>
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs mt-2",
                        roleColors[member.team_role]
                      )}>
                        <RoleIcon className="w-3 h-3" />
                        {t(`role.${member.team_role}`)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="glass-card p-6">
          <h2 className={cn("text-xl font-semibold text-foreground mb-6", isRTL && "text-right")}>
            Pending Invitations ({invitations.length})
          </h2>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={cn(
                  "flex items-center justify-between p-4 bg-secondary/50 rounded-lg",
                  isRTL && "flex-row-reverse"
                )}
              >
                <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="font-medium text-foreground">
                      {invitation.name || invitation.email}
                    </p>
                    <p className="text-sm text-muted-foreground">{invitation.email}</p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs",
                    roleColors[invitation.role]
                  )}>
                    {t(`role.${invitation.role}`)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyInviteLink(invitation.token)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedToken === invitation.token ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
