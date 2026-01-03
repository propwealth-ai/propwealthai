import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, DollarSign, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Influencer {
  id: string;
  email: string;
  full_name: string | null;
  referral_code: string | null;
  created_at: string;
  referredCount: number;
  totalRevenue: number;
}

const AdminPartners: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({ email: '', name: '', code: '' });

  // Fetch influencers with affiliate stats
  const { data: influencers, isLoading } = useQuery({
    queryKey: ['admin-influencers'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, referral_code, created_at')
        .eq('is_influencer', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get referral stats from affiliate_referrals table
      const influencersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get stats from affiliate_referrals table
          const { data: referrals } = await supabase
            .from('affiliate_referrals')
            .select('id, commission_amount')
            .eq('referrer_id', profile.id);

          const referredCount = referrals?.length || 0;
          const totalRevenue = referrals?.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0) || 0;

          return {
            ...profile,
            referredCount,
            totalRevenue,
          };
        })
      );

      return influencersWithStats as Influencer[];
    },
  });

  // Generate unique referral code
  const generateCode = () => {
    const name = newPartner.name.toUpperCase().replace(/\s+/g, '').slice(0, 10);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${name}${random}`;
  };

  // Create influencer mutation
  const createInfluencerMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      // First check if user exists
      const { data: existingUser, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (findError) throw findError;

      if (existingUser) {
        // Update existing user to be an influencer
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            is_influencer: true, 
            referral_code: code,
            plan_type: 'pro' // Give free pro access
          })
          .eq('id', existingUser.id);
        
        if (updateError) throw updateError;
      } else {
        throw new Error('User not found. They must sign up first.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      setIsCreateOpen(false);
      setNewPartner({ email: '', name: '', code: '' });
      toast({
        title: t('admin.partnerCreated'),
        description: t('admin.partnerCreatedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove influencer status
  const removeInfluencerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_influencer: false, 
          referral_code: null,
          plan_type: 'free'
        })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      toast({
        title: t('admin.partnerRemoved'),
        description: t('admin.partnerRemovedDesc'),
      });
    },
  });

  const handleCreatePartner = () => {
    if (!newPartner.email || !newPartner.code) {
      toast({
        title: t('common.error'),
        description: t('admin.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }
    createInfluencerMutation.mutate({ email: newPartner.email, code: newPartner.code });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied'),
      description: `${text} ${t('common.copiedToClipboard')}`,
    });
  };

  // Calculate totals
  const totalReferrals = influencers?.reduce((sum, inf) => sum + inf.referredCount, 0) || 0;
  const totalRevenue = influencers?.reduce((sum, inf) => sum + inf.totalRevenue, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.totalPartners')}</p>
              <p className="text-2xl font-bold text-foreground">{influencers?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-success" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.totalReferrals')}</p>
              <p className="text-2xl font-bold text-foreground">{totalReferrals}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.totalAffiliateRevenue')}</p>
              <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Partner Button */}
      <div className={cn("flex justify-end", isRTL && "justify-start")}>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-premium text-primary-foreground">
              <UserPlus className="w-4 h-4 mr-2" />
              {t('admin.createPartner')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.createPartner')}</DialogTitle>
              <DialogDescription>
                {t('admin.createPartnerDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('admin.partnerName')}</Label>
                <Input
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  placeholder="Marketing Guru"
                  className="input-executive"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.partnerEmail')}</Label>
                <Input
                  type="email"
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                  placeholder="influencer@example.com"
                  className="input-executive"
                />
                <p className="text-xs text-muted-foreground">{t('admin.partnerEmailNote')}</p>
                <div className="p-3 mt-2 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning">{t('admin.partnerMustHaveAccount')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.referralCode')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPartner.code}
                    onChange={(e) => setNewPartner({ ...newPartner, code: e.target.value.toUpperCase() })}
                    placeholder="MARKETINGGURU"
                    className="input-executive"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewPartner({ ...newPartner, code: generateCode() })}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleCreatePartner}
                disabled={createInfluencerMutation.isPending}
                className="btn-premium text-primary-foreground"
              >
                {createInfluencerMutation.isPending ? t('common.loading') : t('admin.createPartner')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Partners Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.partner')}</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.referralCode')}</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.referredUsers')}</TableHead>
              <TableHead className={isRTL ? "text-right" : ""}>{t('admin.revenueGenerated')}</TableHead>
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
            ) : influencers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('admin.noPartners')}
                </TableCell>
              </TableRow>
            ) : (
              influencers?.map((influencer) => (
                <TableRow key={influencer.id} className="border-border">
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse justify-end")}>
                      <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                        <span className="text-warning text-sm font-medium">
                          {influencer.full_name?.charAt(0) || influencer.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <p className="font-medium text-foreground">{influencer.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{influencer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                      <code className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-mono">
                        {influencer.referral_code || 'N/A'}
                      </code>
                      {influencer.referral_code && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(influencer.referral_code!)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={cn("font-medium", isRTL && "text-right")}>
                    {influencer.referredCount}
                  </TableCell>
                  <TableCell className={cn("font-medium text-success", isRTL && "text-right")}>
                    ${influencer.totalRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell className={cn("text-muted-foreground", isRTL && "text-right")}>
                    {new Date(influencer.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeInfluencerMutation.mutate(influencer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPartners;
