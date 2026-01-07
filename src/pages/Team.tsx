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
  Lock,
  MoreVertical,
  Pencil,
  Trash2,
  X
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  
  // Edit member state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editMemberRole, setEditMemberRole] = useState<string>('member');
  const [updating, setUpdating] = useState(false);
  
  // Remove member state
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);
  
  // Cancel invitation state
  const [cancelInviteDialogOpen, setCancelInviteDialogOpen] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<Invitation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const roles = [
    { value: 'admin', label: t('role.admin') },
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

  // Get the correct login URL - prefer published URL over preview
  const getLoginUrl = () => {
    const origin = window.location.origin;
    // If it's a lovableproject.com preview, suggest publishing
    if (origin.includes('lovableproject.com')) {
      return `${origin}/auth`;
    }
    return `${origin}/auth`;
  };

  const copyAllCredentials = () => {
    if (!createdCredentials) return;
    const loginUrl = getLoginUrl();
    const text = `🏠 PropWealth AI - Team Access Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Name: ${createdCredentials.fullName}
🏷️ Role: ${t(`role.${createdCredentials.role}`)}

📧 Email: ${createdCredentials.email}
🔑 Password: ${createdCredentials.password}

🔗 Login: ${loginUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Welcome to the team! 🚀`;
    
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

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setEditMemberRole(member.team_role);
    setEditDialogOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ team_role: editMemberRole as any })
        .eq('id', editingMember.id);
      if (error) throw error;
      toast({ title: t('team.memberUpdated'), description: t('team.memberUpdatedDesc') });
      fetchTeamData();
      setEditDialogOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to update member', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemoving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ team_id: null, team_role: 'member' })
        .eq('id', memberToRemove.id);
      if (error) throw error;
      toast({ title: t('team.memberRemoved'), description: t('team.memberRemovedDesc') });
      fetchTeamData();
      setRemoveMemberDialogOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to remove member', variant: 'destructive' });
    } finally {
      setRemoving(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationToCancel.id);
      if (error) throw error;
      toast({ title: t('team.invitationCancelled'), description: t('team.invitationCancelledDesc') });
      fetchTeamData();
      setCancelInviteDialogOpen(false);
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to cancel invitation', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
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

      {/* Credentials Dialog - Improved Design */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-card to-card/95 border-primary/20 max-w-lg mx-4 sm:mx-auto shadow-2xl">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl text-foreground">
              {t('team.memberCreatedTitle')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {t('team.saveCredentialsWarning')}
            </DialogDescription>
          </DialogHeader>
          
          {createdCredentials && (
            <div className="space-y-5 mt-2">
              {/* Member Info Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{createdCredentials.fullName}</h3>
                  <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mt-1", roleColors[createdCredentials.role])}>
                    {t(`role.${createdCredentials.role}`)}
                  </span>
                </div>
              </div>

              {/* Credentials Card */}
              <div className="bg-secondary/30 rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-secondary/50 border-b border-border">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    {t('team.accessCredentials')}
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  {/* Email */}
                  <div className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t('team.email')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground">{createdCredentials.email}</code>
                      <button
                        onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                        className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {copiedField === 'Email' ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Password */}
                  <div className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t('team.password')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground">
                        {showCreatedPassword ? createdCredentials.password : '••••••••••'}
                      </code>
                      <button
                        onClick={() => setShowCreatedPassword(!showCreatedPassword)}
                        className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showCreatedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(createdCredentials.password, 'Password')}
                        className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
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

              {/* Login URL with Warning */}
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <p className="text-xs font-medium text-primary">{t('team.loginUrl')}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm text-foreground font-mono bg-background/50 px-3 py-2 rounded-lg flex-1 truncate">
                    {getLoginUrl()}
                  </code>
                  <button
                    onClick={() => copyToClipboard(getLoginUrl(), 'URL')}
                    className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors shrink-0"
                  >
                    {copiedField === 'URL' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {window.location.origin.includes('lovableproject.com') && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    ⚠️ {t('team.publishAppNote')}
                  </p>
                )}
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
              const canEdit = isOwner && member.team_role !== 'owner';
              
              return (
                <div
                  key={member.id}
                  className={cn(
                    "p-4 bg-secondary/50 rounded-lg animate-fade-in relative",
                    isRTL && "text-right"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => handleEditMember(member)}>
                          <Pencil className="w-4 h-4 mr-2" /> {t('team.editMember')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setMemberToRemove(member); setRemoveMemberDialogOpen(true); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> {t('team.removeMember')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
