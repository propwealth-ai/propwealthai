import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  DollarSign, 
  Link2, 
  Copy, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  Award,
  Edit2,
  Save,
  X,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface Referral {
  id: string;
  referred_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  referred?: {
    email: string;
    full_name: string | null;
    plan_type: string;
  };
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

interface Referral {
  id: string;
  referred_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  referred?: {
    email: string;
    full_name: string | null;
    plan_type: string;
  };
}

const Affiliate: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState('');
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');

  // Check if user is an influencer
  const isInfluencer = profile?.is_influencer;
  const referralCode = profile?.referral_code;
  const availableBalance = Number(profile?.available_balance || 0);

  // Fetch influencer stats
  const { data: stats } = useQuery({
    queryKey: ['affiliate-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .rpc('get_influencer_stats', { influencer_id: profile.id });
      
      if (error) throw error;
      return data?.[0] || { total_referrals: 0, total_earned: 0 };
    },
    enabled: !!profile?.id && isInfluencer,
  });

  // Fetch referral history
  const { data: referrals } = useQuery({
    queryKey: ['affiliate-referrals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch referred user details
      const referralsWithUsers = await Promise.all(
        (data || []).map(async (ref) => {
          const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name, plan_type')
            .eq('id', ref.referred_id)
            .maybeSingle();
          
          return { ...ref, referred: user };
        })
      );

      return referralsWithUsers as Referral[];
    },
    enabled: !!profile?.id && isInfluencer,
  });

  // Fetch withdrawal requests
  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ['affiliate-withdrawals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('influencer_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WithdrawalRequest[];
    },
    enabled: !!profile?.id && isInfluencer,
  });

  // Create withdrawal request mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('No profile');
      
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount < 50) {
        throw new Error('Minimum withdrawal is $50');
      }
      if (amount > availableBalance) {
        throw new Error('Insufficient balance');
      }
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          influencer_id: profile.id,
          amount,
          payment_method: paymentMethod,
          payment_details: { details: paymentDetails },
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('affiliate.withdrawalRequested'),
        description: t('affiliate.withdrawalRequestedDesc'),
      });
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
      refetchWithdrawals();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message === 'Minimum withdrawal is $50'
          ? t('affiliate.minimumWithdrawal')
          : error.message === 'Insufficient balance'
          ? t('affiliate.insufficientBalance')
          : t('affiliate.withdrawalError'),
        variant: 'destructive',
      });
    },
  });

  // Generate monthly earnings data from referrals
  const monthlyEarningsData = React.useMemo(() => {
    if (!referrals) return [];
    
    const monthlyData: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
    }
    
    // Aggregate earnings by month
    referrals.forEach((ref) => {
      if (ref.status === 'paid') {
        const date = new Date(ref.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (key in monthlyData) {
          monthlyData[key] += Number(ref.commission_amount);
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, earnings]) => ({
      month: new Date(month + '-01').toLocaleDateString(undefined, { month: 'short' }),
      earnings,
    }));
  }, [referrals]);

  // Update referral code mutation
  const updateCodeMutation = useMutation({
    mutationFn: async (newCode: string) => {
      if (!profile?.id) throw new Error('No profile');
      
      // Check if code is already taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', newCode)
        .neq('id', profile.id)
        .maybeSingle();
      
      if (existing) {
        throw new Error('Code already taken');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ referral_code: newCode })
        .eq('id', profile.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('affiliate.codeUpdated'),
        description: t('affiliate.codeUpdatedDesc'),
      });
      setIsEditingCode(false);
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message === 'Code already taken' 
          ? t('affiliate.codeTaken') 
          : t('affiliate.codeUpdateError'),
        variant: 'destructive',
      });
    },
  });

  const handleStartEditCode = () => {
    setNewReferralCode(referralCode || '');
    setIsEditingCode(true);
  };

  const handleSaveCode = () => {
    const trimmedCode = newReferralCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (trimmedCode.length < 3) {
      toast({
        title: t('common.error'),
        description: t('affiliate.codeTooShort'),
        variant: 'destructive',
      });
      return;
    }
    updateCodeMutation.mutate(trimmedCode);
  };

  const handleCancelEdit = () => {
    setIsEditingCode(false);
    setNewReferralCode('');
  };

  const referralLink = referralCode 
    ? `${window.location.origin}/auth?ref=${referralCode}` 
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: t('affiliate.linkCopied'),
      description: t('affiliate.linkCopiedDesc'),
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-primary/20 text-primary border-primary/30">{t('affiliate.paid')}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{t('affiliate.pending')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('affiliate.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle2 className="w-3 h-3 mr-1" />{t('affiliate.paid')}</Badge>;
      case 'approved':
        return <Badge className="bg-info/20 text-info border-info/30"><Clock className="w-3 h-3 mr-1" />{t('admin.approved')}</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t('affiliate.pending')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('admin.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Not an influencer
  if (!isInfluencer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="glass-card max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {t('affiliate.notInfluencer')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('affiliate.notInfluencerDesc')}
            </p>
            <Button variant="outline" disabled>
              {t('affiliate.applyToBecomePartner')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
          <Award className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-bold text-foreground">{t('affiliate.title')}</h1>
          <p className="text-muted-foreground">{t('affiliate.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('affiliate.totalReferrals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {stats?.total_referrals || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t('affiliate.totalEarned')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              ${Number(stats?.total_earned || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('affiliate.conversionRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {referrals && referrals.length > 0 
                ? `${((referrals.filter(r => r.status === 'paid').length / referrals.length) * 100).toFixed(0)}%`
                : '0%'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {t('affiliate.availableBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              ${availableBalance.toFixed(2)}
            </p>
            <Button 
              size="sm" 
              className="btn-premium mt-2 w-full"
              onClick={() => setShowWithdrawDialog(true)}
              disabled={availableBalance < 50}
            >
              <ArrowUpRight className="w-4 h-4 mr-1" />
              {t('affiliate.requestWithdrawal')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Requests */}
      {withdrawals && withdrawals.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              {t('affiliate.withdrawalHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div 
                  key={withdrawal.id}
                  className={cn(
                    "flex items-center justify-between p-4 bg-secondary/50 rounded-lg",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="font-bold text-foreground">
                      ${withdrawal.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    {withdrawal.admin_notes && (
                      <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {withdrawal.admin_notes}
                      </span>
                    )}
                    {getWithdrawalStatusBadge(withdrawal.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('affiliate.requestWithdrawal')}</DialogTitle>
            <DialogDescription>
              {t('affiliate.withdrawalMinimum')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{t('affiliate.availableBalance')}</p>
              <p className="text-2xl font-bold text-success">${availableBalance.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('affiliate.withdrawAmount')}</Label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="50.00"
                min={50}
                max={availableBalance}
                className="input-executive"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('affiliate.paymentMethod')}</Label>
              <Input
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="PayPal, Bank Transfer, PIX..."
                className="input-executive"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('affiliate.paymentDetails')}</Label>
              <Textarea
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder={t('affiliate.paymentDetailsPlaceholder')}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending || parseFloat(withdrawAmount) < 50}
              className="btn-premium"
            >
              {withdrawMutation.isPending ? t('common.loading') : t('affiliate.submitWithdrawal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral Link & Code */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            {t('affiliate.yourReferralLink')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="input-executive flex-1"
            />
            <Button 
              onClick={handleCopyLink}
              className="btn-premium"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="ml-2">{copied ? t('common.copied') : t('common.copy')}</span>
            </Button>
          </div>
          
          {/* Editable Referral Code */}
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
            <span className="text-sm text-muted-foreground">{t('affiliate.referralCodeLabel')}:</span>
            {isEditingCode ? (
              <>
                <Input
                  value={newReferralCode}
                  onChange={(e) => setNewReferralCode(e.target.value.toLowerCase())}
                  placeholder={t('affiliate.enterNewCode')}
                  className="input-executive max-w-[200px] font-mono"
                  disabled={updateCodeMutation.isPending}
                />
                <Button
                  size="sm"
                  onClick={handleSaveCode}
                  disabled={updateCodeMutation.isPending}
                  className="btn-premium"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={updateCodeMutation.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="font-mono font-bold text-primary">{referralCode}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStartEditCode}
                  className="ml-auto"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  {t('affiliate.editCode')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Earnings Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t('affiliate.monthlyEarnings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyEarningsData.length > 0 ? (
            <ChartContainer
              config={{
                earnings: {
                  label: t('affiliate.earnings'),
                  color: 'hsl(var(--primary))',
                },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyEarningsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#earningsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('affiliate.noEarningsData')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {t('affiliate.referralHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div 
                  key={referral.id}
                  className={cn(
                    "flex items-center justify-between p-4 bg-secondary/50 rounded-lg",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="font-medium text-foreground">
                      {referral.referred?.full_name || referral.referred?.email || t('common.unknown')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                    <Badge variant="outline" className="capitalize">
                      {referral.referred?.plan_type || 'free'}
                    </Badge>
                    {getStatusBadge(referral.status)}
                    <span className="font-bold text-primary">
                      ${Number(referral.commission_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('affiliate.noReferrals')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Affiliate;
