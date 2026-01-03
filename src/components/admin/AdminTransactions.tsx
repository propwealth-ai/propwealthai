import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, CreditCard, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  referral_code: string | null;
  created_at: string;
  user?: {
    email: string;
    full_name: string | null;
  };
}

interface AffiliateReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  referrer?: {
    email: string;
    full_name: string | null;
  };
  referred?: {
    email: string;
    full_name: string | null;
  };
}

const AdminTransactions: React.FC = () => {
  const { t, isRTL } = useLanguage();

  // Fetch regular transactions
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Fetch user details for each transaction
      const transactionsWithUsers = await Promise.all(
        (data || []).map(async (tx) => {
          if (!tx.user_id) return tx;
          
          const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', tx.user_id)
            .maybeSingle();
          
          return { ...tx, user };
        })
      );

      return transactionsWithUsers as Transaction[];
    },
  });

  // Fetch affiliate referrals
  const { data: affiliateReferrals, isLoading: affLoading, refetch: refetchAff } = useQuery({
    queryKey: ['admin-affiliate-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Fetch referrer and referred user details
      const referralsWithUsers = await Promise.all(
        (data || []).map(async (ref) => {
          const [referrerRes, referredRes] = await Promise.all([
            supabase.from('profiles').select('email, full_name').eq('id', ref.referrer_id).maybeSingle(),
            supabase.from('profiles').select('email, full_name').eq('id', ref.referred_id).maybeSingle()
          ]);
          
          return { 
            ...ref, 
            referrer: referrerRes.data,
            referred: referredRes.data
          };
        })
      );

      return referralsWithUsers as AffiliateReferral[];
    },
  });

  // Mock transactions for demo
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      user_id: 'mock-1',
      amount: 29,
      currency: 'USD',
      status: 'completed',
      description: 'Pro Plan - Monthly',
      referral_code: 'MARKETINGGURU',
      created_at: new Date().toISOString(),
      user: { email: 'john@example.com', full_name: 'John Doe' },
    },
    {
      id: '2',
      user_id: 'mock-2',
      amount: 29,
      currency: 'USD',
      status: 'completed',
      description: 'Pro Plan - Monthly',
      referral_code: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      user: { email: 'jane@example.com', full_name: 'Jane Smith' },
    },
    {
      id: '3',
      user_id: 'mock-3',
      amount: 290,
      currency: 'USD',
      status: 'completed',
      description: 'Pro Plan - Annual',
      referral_code: 'PROPEXPERT',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      user: { email: 'bob@example.com', full_name: 'Bob Wilson' },
    },
    {
      id: '4',
      user_id: 'mock-4',
      amount: 29,
      currency: 'USD',
      status: 'failed',
      description: 'Pro Plan - Monthly',
      referral_code: null,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      user: { email: 'alice@example.com', full_name: 'Alice Brown' },
    },
    {
      id: '5',
      user_id: 'mock-5',
      amount: 29,
      currency: 'USD',
      status: 'refunded',
      description: 'Pro Plan - Monthly (Refund)',
      referral_code: null,
      created_at: new Date(Date.now() - 345600000).toISOString(),
      user: { email: 'charlie@example.com', full_name: 'Charlie Davis' },
    },
  ];

  const displayTransactions = transactions?.length ? transactions : mockTransactions;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'failed':
        return 'bg-destructive/20 text-destructive';
      case 'refunded':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <ArrowUpRight className="w-4 h-4 text-success" />;
      case 'failed':
      case 'refunded':
        return <ArrowDownRight className="w-4 h-4 text-destructive" />;
      default:
        return <CreditCard className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isLoading = txLoading || affLoading;

  const refetch = () => {
    refetchTx();
    refetchAff();
  };

  // Calculate stats
  const totalRevenue = displayTransactions
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const affiliateRevenue = displayTransactions
    .filter(tx => tx.status === 'completed' && tx.referral_code)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const refundedAmount = displayTransactions
    .filter(tx => tx.status === 'refunded')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalCommissions = affiliateReferrals?.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0) || 0;

  const getAffiliateStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-success" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.totalRevenue')}</p>
              <p className="text-2xl font-bold text-success">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.affiliateRevenue')}</p>
              <p className="text-2xl font-bold text-primary">${affiliateRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.totalCommissions')}</p>
              <p className="text-2xl font-bold text-warning">${totalCommissions.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-destructive" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.refunded')}</p>
              <p className="text-2xl font-bold text-destructive">${refundedAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Transactions and Affiliate Referrals */}
      <Tabs defaultValue="transactions" className="w-full">
        <div className={cn("flex items-center justify-between mb-4", isRTL && "flex-row-reverse")}>
          <TabsList>
            <TabsTrigger value="transactions">{t('admin.transactions')}</TabsTrigger>
            <TabsTrigger value="affiliates">{t('admin.affiliateReferrals')}</TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={refetch} className="border-primary/50 text-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.refresh')}
          </Button>
        </div>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-3">
          {isLoading ? (
            <div className="glass-card p-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          ) : displayTransactions.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              {t('admin.noTransactions')}
            </div>
          ) : (
            displayTransactions.map((tx) => (
              <div key={tx.id} className={cn("glass-card p-4 flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    tx.status === 'completed' ? 'bg-success/10' : tx.status === 'failed' ? 'bg-destructive/10' : 'bg-muted'
                  )}>
                    {getStatusIcon(tx.status)}
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="font-medium text-foreground">
                      {tx.user?.full_name || tx.user?.email || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">{tx.description}</p>
                    {tx.referral_code && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">
                        via {tx.referral_code}
                      </span>
                    )}
                  </div>
                </div>
                <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                  <div className={isRTL ? "text-left" : "text-right"}>
                    <p className={cn(
                      "font-bold",
                      tx.status === 'completed' ? 'text-success' : tx.status === 'refunded' ? 'text-destructive' : 'text-foreground'
                    )}>
                      {tx.status === 'refunded' ? '-' : '+'}${tx.amount.toFixed(2)} {tx.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn("px-2 py-1 text-xs rounded-full font-medium capitalize", getStatusColor(tx.status))}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Affiliate Referrals Tab */}
        <TabsContent value="affiliates" className="space-y-3">
          {affLoading ? (
            <div className="glass-card p-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          ) : !affiliateReferrals?.length ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              {t('admin.noAffiliateReferrals')}
            </div>
          ) : (
            affiliateReferrals.map((ref) => (
              <div key={ref.id} className={cn("glass-card p-4 flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="font-medium text-foreground">
                      {ref.referrer?.full_name || ref.referrer?.email || 'Unknown Influencer'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('admin.referred')}: {ref.referred?.full_name || ref.referred?.email || 'Unknown User'}
                    </p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                  <div className={isRTL ? "text-left" : "text-right"}>
                    <p className="font-bold text-primary">
                      ${Number(ref.commission_amount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn("px-2 py-1 text-xs rounded-full font-medium capitalize", getAffiliateStatusColor(ref.status))}>
                    {ref.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Note about mock data */}
      {!transactions?.length && (
        <p className="text-center text-sm text-muted-foreground">
          {t('admin.mockDataNote')}
        </p>
      )}
    </div>
  );
};

export default AdminTransactions;
