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
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  User,
  Lock
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
  DialogDescription,
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

interface CreatedMemberCredentials {
  email: string;
  password: string;
  fullName: string;
  role: string;
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

const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const Team: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Form state
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberRole, setMemberRole] = useState<string>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Created member credentials
  const [createdCredentials, setCreatedCredentials] = useState<CreatedMemberCredentials | null>(null);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);

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

  const handleCreateMember = async () => {
    if (!profile?.team_id || !memberEmail || !memberPassword) return;
    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: {
          email: memberEmail,
          password: memberPassword,
          fullName: memberName,
          role: memberRole,
          teamId: profile.team_id,
          invitedBy: profile.id,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast({
          title: t('common.error'),
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      // Success - save credentials and show dialog
      setCreatedCredentials({
        email: memberEmail,
        password: memberPassword,
        fullName: memberName || memberEmail,
        role: memberRole,
      });

      setDialogOpen(false);
      setCredentialsDialogOpen(true);
      
      // Reset form
      setMemberName('');
      setMemberEmail('');
      setMemberPassword('');
      setMemberRole('member');
      
      // Refresh team data
      fetchTeamData();

      toast({
        title: t('team.memberCreated'),
        description: t('team.memberCreatedDesc'),
      });
    } catch (error: any) {
      console.error('Error creating member:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to create team member',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: t('common.copied'),
      description: `${field} ${t('common.copiedToClipboard')}`,
    });
  };

  const copyAllCredentials = () => {
    if (!createdCredentials) return;
    const text = `PropWealth AI - Access Credentials

Name: ${createdCredentials.fullName}
Role: ${t(`role.${createdCredentials.role}`)}
Email: ${createdCredentials.email}
Password: ${createdCredentials.password}

Login URL: ${window.location.origin}/auth`;
    
    navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied'),
      description: t('team.allCredentialsCopied'),
    });
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
      <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('team.title')}</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">{t('team.subtitle')}</p>
        </div>
        
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-premium text-primary-foreground gap-2 w-full sm:w-auto">
                <UserPlus className="w-4 h-4" />
                {t('team.addMember')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  {t('team.createMember')}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {t('team.createMemberDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('team.name')}
                  </label>
                  <Input
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="input-executive"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t('team.email')} *
                  </label>
                  <Input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="input-executive"
                    placeholder="member@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {t('team.password')} *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        className="input-executive pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMemberPassword(generateSecurePassword())}
                      className="shrink-0"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('team.passwordHint')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('team.role')}
                  </label>
                  <Select value={memberRole} onValueChange={setMemberRole}>
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
                  onClick={handleCreateMember}
                  disabled={!memberEmail || !memberPassword || creating}
                  className="w-full btn-premium text-primary-foreground"
                >
                  {creating ? t('common.loading') : t('team.createAndGetCredentials')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Credentials Dialog */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              {t('team.memberCreatedTitle')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('team.saveCredentialsWarning')}
            </DialogDescription>
          </DialogHeader>
          
          {createdCredentials && (
            <div className="space-y-4 mt-4">
              {/* Credentials Card */}
              <div className="p-4 bg-secondary/50 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('team.name')}:</span>
                  <span className="font-medium text-foreground">{createdCredentials.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('team.role')}:</span>
                  <span className={cn("px-2 py-1 rounded text-xs", roleColors[createdCredentials.role])}>
                    {t(`role.${createdCredentials.role}`)}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{t('team.email')}:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">{createdCredentials.email}</span>
                      <button
                        onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedField === 'Email' ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('team.password')}:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">
                        {showCreatedPassword ? createdCredentials.password : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => setShowCreatedPassword(!showCreatedPassword)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showCreatedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(createdCredentials.password, 'Password')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedField === 'Password' ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login URL */}
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('team.loginUrl')}:</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm text-primary font-mono truncate mr-2">
                    {window.location.origin}/auth
                  </code>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/auth`, 'URL')}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {copiedField === 'URL' ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Copy All Button */}
              <Button
                onClick={copyAllCredentials}
                className="w-full btn-premium text-primary-foreground gap-2"
              >
                <Copy className="w-4 h-4" />
                {t('team.copyAllCredentials')}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t('team.sendCredentialsNote')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Team Members */}
      <div className="glass-card p-4 sm:p-6">
        <h2 className={cn("text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6", isRTL && "text-right")}>
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
                    <div className="team-avatar flex items-center justify-center bg-secondary shrink-0">
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
        <div className="glass-card p-4 sm:p-6">
          <h2 className={cn("text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6", isRTL && "text-right")}>
            Pending Invitations ({invitations.length})
          </h2>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-secondary/50 rounded-lg",
                  isRTL && "sm:flex-row-reverse"
                )}
              >
                <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="font-medium text-foreground">
                      {invitation.name || invitation.email}
                    </p>
                    <p className="text-sm text-muted-foreground">{invitation.email}</p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-3 w-full sm:w-auto justify-end", isRTL && "flex-row-reverse")}>
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
