import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ArrowUpRight,
  User,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WithdrawalRequest {
  id: string;
  influencer_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_details: Record<string, unknown>;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  influencer?: {
    email: string;
    full_name: string | null;
    referral_code: string | null;
    available_balance: number | null;
  };
}

const AdminWithdrawals: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch withdrawal requests
  const { data: withdrawals, isLoading, refetch } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch influencer details
      const withdrawalsWithInfluencers = await Promise.all(
        (data || []).map(async (req) => {
          const { data: influencer } = await supabase
            .from('profiles')
            .select('email, full_name, referral_code, available_balance')
            .eq('id', req.influencer_id)
            .maybeSingle();
          
          return { ...req, influencer };
        })
      );

      return withdrawalsWithInfluencers as WithdrawalRequest[];
    },
  });

  // Process withdrawal mutation
  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status,
          admin_notes: notes,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;

      // If marked as paid, deduct from available_balance
      if (status === 'paid' && selectedRequest) {
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({
            available_balance: (selectedRequest.influencer?.available_balance || 0) - selectedRequest.amount
          })
          .eq('id', selectedRequest.influencer_id);
        
        if (balanceError) throw balanceError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      setSelectedRequest(null);
      setAdminNotes('');
      toast({
        title: t('admin.withdrawalProcessed'),
        description: t('admin.withdrawalProcessedDesc'),
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

  const handleProcess = (status: 'approved' | 'rejected' | 'paid') => {
    if (!selectedRequest) return;
    processWithdrawalMutation.mutate({
      id: selectedRequest.id,
      status,
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" />{t('affiliate.pending')}</Badge>;
      case 'approved':
        return <Badge className="bg-info/20 text-info border-info/30"><CheckCircle2 className="w-3 h-3 mr-1" />{t('admin.approved')}</Badge>;
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30"><ArrowUpRight className="w-3 h-3 mr-1" />{t('affiliate.paid')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-destructive/20"><XCircle className="w-3 h-3 mr-1" />{t('admin.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredWithdrawals = withdrawals?.filter(w => 
    statusFilter === 'all' || w.status === statusFilter
  ) || [];

  // Calculate stats
  const pendingCount = withdrawals?.filter(w => w.status === 'pending').length || 0;
  const pendingAmount = withdrawals?.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0) || 0;
  const paidAmount = withdrawals?.filter(w => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.pendingWithdrawals')}</p>
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">${pendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.totalPaidOut')}</p>
              <p className="text-2xl font-bold text-success">${paidAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-sm text-muted-foreground">{t('admin.totalRequests')}</p>
              <p className="text-2xl font-bold text-foreground">{withdrawals?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Refresh */}
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('admin.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('affiliate.pending')}</SelectItem>
            <SelectItem value="approved">{t('admin.approved')}</SelectItem>
            <SelectItem value="paid">{t('affiliate.paid')}</SelectItem>
            <SelectItem value="rejected">{t('admin.rejected')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()} className="border-primary/50 text-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Withdrawal Requests List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="glass-card p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('admin.noWithdrawals')}</p>
          </div>
        ) : (
          filteredWithdrawals.map((request) => (
            <div 
              key={request.id} 
              className={cn(
                "glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors",
                isRTL && "flex-row-reverse"
              )}
              onClick={() => {
                setSelectedRequest(request);
                setAdminNotes(request.admin_notes || '');
              }}
            >
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <p className="font-medium text-foreground">
                    {request.influencer?.full_name || request.influencer?.email || t('common.unknown')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.influencer?.referral_code && (
                      <span className="font-mono text-primary mr-2">{request.influencer.referral_code}</span>
                    )}
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className={isRTL ? "text-left" : "text-right"}>
                  <p className="text-xl font-bold text-primary">${request.amount.toFixed(2)}</p>
                </div>
                {getStatusBadge(request.status)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Process Withdrawal Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.processWithdrawal')}</DialogTitle>
            <DialogDescription>
              {t('admin.processWithdrawalDesc')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="glass-card p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.influencer')}</span>
                  <span className="font-medium">{selectedRequest.influencer?.full_name || selectedRequest.influencer?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.amount')}</span>
                  <span className="font-bold text-primary">${selectedRequest.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.availableBalance')}</span>
                  <span className="font-medium">${(selectedRequest.influencer?.available_balance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.requestDate')}</span>
                  <span>{new Date(selectedRequest.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('admin.status')}</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {t('admin.adminNotes')}
                </Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t('admin.adminNotesPlaceholder')}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleProcess('rejected')}
                  disabled={processWithdrawalMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('admin.reject')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleProcess('approved')}
                  disabled={processWithdrawalMutation.isPending}
                  className="border-info text-info"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t('admin.approve')}
                </Button>
              </>
            )}
            {(selectedRequest?.status === 'pending' || selectedRequest?.status === 'approved') && (
              <Button
                onClick={() => handleProcess('paid')}
                disabled={processWithdrawalMutation.isPending}
                className="btn-premium"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {t('admin.markAsPaid')}
              </Button>
            )}
            {selectedRequest?.status === 'paid' && (
              <p className="text-sm text-muted-foreground">{t('admin.alreadyPaid')}</p>
            )}
            {selectedRequest?.status === 'rejected' && (
              <p className="text-sm text-destructive">{t('admin.wasRejected')}</p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;