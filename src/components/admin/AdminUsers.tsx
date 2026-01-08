import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MoreVertical, Shield, Ban, CreditCard, UserCheck, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan_type: string;
  payment_status: string;
  created_at: string;
  is_influencer: boolean;
  referral_code: string | null;
}

const AdminUsers: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, plan_type, payment_status, created_at, is_influencer, referral_code')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Profile> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: t('admin.userUpdated'),
        description: t('admin.userUpdatedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast({
        title: t('common.error'),
        description: t('admin.updateError'),
        variant: 'destructive',
      });
    },
  });

  const handleOpenUpgradeDialog = (user: Profile) => {
    setSelectedUser(user);
    setSelectedPlan('pro');
    setUpgradeDialogOpen(true);
  };

  const handleUpgrade = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ 
      userId: selectedUser.id, 
      updates: { plan_type: selectedPlan, payment_status: 'active' } 
    });
    setUpgradeDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDowngrade = (userId: string) => {
    updateUserMutation.mutate({ userId, updates: { plan_type: 'free', payment_status: 'active' } });
  };

  const handleBan = (userId: string) => {
    updateUserMutation.mutate({ userId, updates: { payment_status: 'banned' } });
  };

  const handleUnban = (userId: string) => {
    updateUserMutation.mutate({ userId, updates: { payment_status: 'active' } });
  };

  // Filter profiles
  const filteredProfiles = profiles?.filter(profile => {
    const matchesSearch = 
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = filterStatus === 'all' || profile.payment_status === filterStatus;
    const matchesPlan = filterPlan === 'all' || profile.plan_type === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success/20 text-success',
      past_due: 'bg-destructive/20 text-destructive',
      cancelled: 'bg-warning/20 text-warning',
      banned: 'bg-destructive text-destructive-foreground',
    };
    return styles[status] || 'bg-muted text-muted-foreground';
  };

  const getPlanBadge = (plan: string) => {
    const styles: Record<string, string> = {
      pro: 'bg-primary/20 text-primary',
      business: 'bg-info/20 text-info',
      enterprise: 'bg-warning/20 text-warning',
      free: 'bg-muted text-muted-foreground',
    };
    return styles[plan] || 'bg-muted text-muted-foreground';
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      pro: 'Pro',
      business: 'Business',
      enterprise: 'Enterprise',
      free: 'Free',
    };
    return labels[plan] || plan;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className={cn("flex flex-col md:flex-row gap-4", isRTL && "md:flex-row-reverse")}>
        <div className="relative flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={t('admin.searchUsers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("input-executive", isRTL ? "pr-10" : "pl-10")}
          />
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-full md:w-40 input-executive">
            <SelectValue placeholder={t('admin.filterPlan')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.allPlans')}</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-40 input-executive">
            <SelectValue placeholder={t('admin.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()} className="border-primary/50 text-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.name')}</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.email')}</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.plan')}</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.status')}</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.joinDate')}</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredProfiles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('admin.noUsersFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles?.map((profile) => (
                <TableRow 
                  key={profile.id} 
                  className={cn(
                    "border-border",
                    profile.payment_status === 'past_due' && "bg-destructive/5",
                    profile.payment_status === 'banned' && "bg-destructive/10 opacity-60"
                  )}
                >
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse justify-end")}>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary text-sm font-medium">
                          {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <p className="font-medium text-foreground">{profile.full_name || 'Unknown'}</p>
                        {profile.is_influencer && (
                          <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                            Influencer
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn("text-muted-foreground", isRTL && "text-right")}>
                    {profile.email}
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <span className={cn("px-2 py-1 text-xs rounded-full font-medium", getPlanBadge(profile.plan_type))}>
                      {getPlanLabel(profile.plan_type)}
                    </span>
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <span className={cn("px-2 py-1 text-xs rounded-full font-medium capitalize", getStatusBadge(profile.payment_status))}>
                      {profile.payment_status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className={cn("text-muted-foreground", isRTL && "text-right")}>
                    {new Date(profile.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? "start" : "end"}>
                        {profile.plan_type === 'free' ? (
                          <DropdownMenuItem onClick={() => handleOpenUpgradeDialog(profile)}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            {t('admin.upgradePlan')}
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleOpenUpgradeDialog(profile)}>
                              <CreditCard className="w-4 h-4 mr-2" />
                              {t('admin.changePlan')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDowngrade(profile.id)}>
                              <CreditCard className="w-4 h-4 mr-2" />
                              {t('admin.downgradeToFree')}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleUnban(profile.id)}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          {t('admin.activateUser')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBan(profile.id)} className="text-destructive">
                          <Ban className="w-4 h-4 mr-2" />
                          {t('admin.banUser')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className={cn("flex justify-between text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
        <span>{t('admin.showing')} {filteredProfiles?.length || 0} {t('admin.of')} {profiles?.length || 0} {t('admin.users')}</span>
        <span>
          {profiles?.filter(p => p.payment_status === 'past_due').length || 0} {t('admin.pastDue')}
        </span>
      </div>

      {/* Upgrade Plan Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.selectPlan')}</DialogTitle>
            <DialogDescription>
              {t('admin.selectPlanDesc')} {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.plan')}</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="input-executive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      Pro - $29.99/mo
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-info"></span>
                      Business - $99.99/mo
                    </div>
                  </SelectItem>
                  <SelectItem value="enterprise">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning"></span>
                      Enterprise - $299.99/mo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="btn-premium" onClick={handleUpgrade}>
              {t('admin.confirmUpgrade')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
