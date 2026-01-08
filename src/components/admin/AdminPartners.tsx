import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, DollarSign, Copy, RefreshCw, Trash2, Edit2, Eye, Check, X, FileDown, Calendar, BarChart3, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AffiliateMetricsDashboard from './AffiliateMetricsDashboard';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import jsPDF from 'jspdf';

interface ReferralDetail {
  id: string;
  referred_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  referred_email: string;
  referred_name: string | null;
  referred_plan: string;
  selected?: boolean;
}

interface Influencer {
  id: string;
  email: string;
  full_name: string | null;
  referral_code: string | null;
  created_at: string;
  referredCount: number;
  totalRevenue: number;
  referrals: ReferralDetail[];
}

const AdminPartners: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({ email: '', name: '', code: '' });
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [editingReferralId, setEditingReferralId] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<string>('');
  const [selectedReferrals, setSelectedReferrals] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('paid');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('table');

  // Fetch influencers with affiliate stats and referral details
  const { data: influencers, isLoading } = useQuery({
    queryKey: ['admin-influencers'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, referral_code, created_at')
        .eq('is_influencer', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get referral stats with referred user details
      const influencersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get referrals with referred user details
          const { data: referrals } = await supabase
            .from('affiliate_referrals')
            .select(`
              id,
              referred_id,
              commission_amount,
              status,
              created_at,
              profiles!affiliate_referrals_referred_id_fkey (
                email,
                full_name,
                plan_type
              )
            `)
            .eq('referrer_id', profile.id)
            .order('created_at', { ascending: false });

          const referralDetails: ReferralDetail[] = (referrals || []).map((r) => ({
            id: r.id,
            referred_id: r.referred_id,
            commission_amount: Number(r.commission_amount || 0),
            status: r.status,
            created_at: r.created_at,
            referred_email: r.profiles?.email || 'Unknown',
            referred_name: r.profiles?.full_name || null,
            referred_plan: r.profiles?.plan_type || 'free',
          }));

          const referredCount = referralDetails.length;
          // Only count revenue from referrals with paid status AND referred user has paid plan (pro, business, enterprise)
          const paidPlans = ['pro', 'business', 'enterprise'];
          const totalRevenue = referralDetails
            .filter(r => r.status === 'paid' && paidPlans.includes(r.referred_plan))
            .reduce((sum, r) => sum + r.commission_amount, 0);

          return {
            ...profile,
            referredCount,
            totalRevenue,
            referrals: referralDetails,
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

  // Update commission mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async ({ referralId, commission }: { referralId: string; commission: number }) => {
      const { error } = await supabase
        .from('affiliate_referrals')
        .update({ commission_amount: commission })
        .eq('id', referralId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      setEditingReferralId(null);
      setEditingCommission('');
      toast({
        title: t('admin.commissionUpdated'),
        description: t('admin.commissionUpdatedDesc'),
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

  const handleStartEditCommission = (referralId: string, currentCommission: number) => {
    setEditingReferralId(referralId);
    setEditingCommission(currentCommission.toString());
  };

  const handleSaveCommission = (referralId: string) => {
    const commission = parseFloat(editingCommission);
    if (isNaN(commission) || commission < 0) {
      toast({
        title: t('common.error'),
        description: t('admin.invalidCommission'),
        variant: 'destructive',
      });
      return;
    }
    updateCommissionMutation.mutate({ referralId, commission });
  };

  const handleCancelEditCommission = () => {
    setEditingReferralId(null);
    setEditingCommission('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied'),
      description: `${text} ${t('common.copiedToClipboard')}`,
    });
  };

  // Toggle single referral selection
  const toggleReferralSelection = (referralId: string) => {
    setSelectedReferrals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(referralId)) {
        newSet.delete(referralId);
      } else {
        newSet.add(referralId);
      }
      return newSet;
    });
  };

  // Toggle all referrals selection
  const toggleAllReferrals = () => {
    if (!selectedInfluencer) return;
    if (selectedReferrals.size === selectedInfluencer.referrals.length) {
      setSelectedReferrals(new Set());
    } else {
      setSelectedReferrals(new Set(selectedInfluencer.referrals.map(r => r.id)));
    }
  };

  // Bulk update status mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ referralIds, status }: { referralIds: string[]; status: string }) => {
      const { error } = await supabase
        .from('affiliate_referrals')
        .update({ status })
        .in('id', referralIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      setSelectedReferrals(new Set());
      toast({
        title: t('admin.bulkUpdateSuccess'),
        description: t('admin.bulkUpdateSuccessDesc'),
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

  const handleBulkStatusUpdate = () => {
    if (selectedReferrals.size === 0) return;
    bulkUpdateStatusMutation.mutate({ 
      referralIds: Array.from(selectedReferrals), 
      status: bulkStatus 
    });
  };

  // Get all referrals for report
  const allReferrals = useMemo(() => {
    if (!influencers) return [];
    return influencers.flatMap(inf => 
      inf.referrals.map(r => ({
        ...r,
        influencerName: inf.full_name || inf.email,
        influencerEmail: inf.email,
        influencerCode: inf.referral_code,
      }))
    );
  }, [influencers]);

  // Filter referrals by date range
  const filteredReferralsForReport = useMemo(() => {
    let filtered = allReferrals;
    if (reportStartDate) {
      filtered = filtered.filter(r => new Date(r.created_at) >= new Date(reportStartDate));
    }
    if (reportEndDate) {
      const endDate = new Date(reportEndDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.created_at) <= endDate);
    }
    return filtered;
  }, [allReferrals, reportStartDate, reportEndDate]);

  // Filter influencers based on status filter
  const filteredInfluencers = useMemo(() => {
    if (!influencers || statusFilter === 'all') return influencers;
    return influencers.filter(inf => 
      inf.referrals.some(r => r.status === statusFilter)
    ).map(inf => ({
      ...inf,
      referrals: inf.referrals.filter(r => r.status === statusFilter),
      referredCount: inf.referrals.filter(r => r.status === statusFilter).length,
      totalRevenue: inf.referrals.filter(r => r.status === statusFilter).reduce((sum, r) => sum + r.commission_amount, 0),
    }));
  }, [influencers, statusFilter]);

  // Generate PDF Report
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(16, 185, 129); // Emerald
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PropWealth AI', 14, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(t('admin.commissionsReport'), 14, 32);
    
    // Date range
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    let dateText = t('admin.allTime');
    if (reportStartDate || reportEndDate) {
      const startStr = reportStartDate || t('admin.beginning');
      const endStr = reportEndDate || t('admin.today');
      dateText = `${startStr} - ${endStr}`;
    }
    doc.text(`${t('admin.period')}: ${dateText}`, 14, 50);
    doc.text(`${t('admin.generatedOn')}: ${new Date().toLocaleDateString()}`, 14, 56);
    
    // Summary stats
    const paidReferrals = filteredReferralsForReport.filter(r => r.status === 'paid');
    const pendingReferrals = filteredReferralsForReport.filter(r => r.status === 'pending');
    const totalPaid = paidReferrals.reduce((sum, r) => sum + r.commission_amount, 0);
    const totalPending = pendingReferrals.reduce((sum, r) => sum + r.commission_amount, 0);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(t('admin.summary'), 14, 70);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${t('admin.totalReferrals')}: ${filteredReferralsForReport.length}`, 14, 78);
    doc.text(`${t('admin.paidCommissions')}: $${totalPaid.toFixed(2)} (${paidReferrals.length} ${t('admin.referrals').toLowerCase()})`, 14, 86);
    doc.text(`${t('admin.pendingCommissions')}: $${totalPending.toFixed(2)} (${pendingReferrals.length} ${t('admin.referrals').toLowerCase()})`, 14, 94);
    doc.text(`${t('admin.totalCommissions')}: $${(totalPaid + totalPending).toFixed(2)}`, 14, 102);
    
    // Table header
    let yPos = 118;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, yPos - 6, pageWidth - 28, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(t('admin.partner'), 16, yPos);
    doc.text(t('admin.referredUser'), 55, yPos);
    doc.text(t('admin.plan'), 100, yPos);
    doc.text(t('admin.status'), 125, yPos);
    doc.text(t('admin.commission'), 150, yPos);
    doc.text(t('admin.date'), 175, yPos);
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    filteredReferralsForReport.forEach((referral, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, yPos - 5, pageWidth - 28, 8, 'F');
      }
      
      doc.setFontSize(8);
      doc.text((referral.influencerName || '').substring(0, 18), 16, yPos);
      doc.text((referral.referred_name || referral.referred_email || '').substring(0, 20), 55, yPos);
      doc.text(referral.referred_plan, 100, yPos);
      doc.text(referral.status, 125, yPos);
      doc.text(`$${referral.commission_amount.toFixed(2)}`, 150, yPos);
      doc.text(new Date(referral.created_at).toLocaleDateString(), 175, yPos);
      
      yPos += 8;
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`www.propwealthai.com | info@propwealthai.com`, 14, 285);
      doc.text(`${t('admin.page')} ${i} ${t('admin.of')} ${pageCount}`, pageWidth - 30, 285);
    }
    
    // Save
    const filename = `commissions-report-${reportStartDate || 'all'}-${reportEndDate || 'now'}.pdf`;
    doc.save(filename);
    
    toast({
      title: t('admin.reportGenerated'),
      description: t('admin.reportGeneratedDesc'),
    });
    
    setIsReportModalOpen(false);
  };

  // Calculate totals based on filter
  const totalReferrals = filteredInfluencers?.reduce((sum, inf) => sum + inf.referredCount, 0) || 0;
  const totalRevenue = filteredInfluencers?.reduce((sum, inf) => sum + inf.totalRevenue, 0) || 0;

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

      {/* Action Buttons */}
      <div className={cn("flex gap-3 flex-wrap", isRTL ? "justify-start" : "justify-end")}>
        {/* Export Report Button */}
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <FileDown className="w-4 h-4 mr-2" />
              {t('admin.exportReport')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-primary" />
                {t('admin.commissionsReport')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.exportReportDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('admin.startDate')}
                  </Label>
                  <Input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="input-executive"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('admin.endDate')}
                  </Label>
                  <Input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="input-executive"
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">{t('admin.previewSummary')}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">{t('admin.totalReferrals')}:</span>
                  <span className="font-medium">{filteredReferralsForReport.length}</span>
                  <span className="text-muted-foreground">{t('admin.paidCommissions')}:</span>
                  <span className="font-medium text-success">
                    ${filteredReferralsForReport.filter(r => r.status === 'paid').reduce((s, r) => s + r.commission_amount, 0).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">{t('admin.pendingCommissions')}:</span>
                  <span className="font-medium text-warning">
                    ${filteredReferralsForReport.filter(r => r.status === 'pending').reduce((s, r) => s + r.commission_amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={generatePDFReport} className="btn-premium text-primary-foreground">
                <FileDown className="w-4 h-4 mr-2" />
                {t('admin.downloadPDF')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Partner Button */}
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

      {/* View Tabs: Table vs Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={cn("flex items-center justify-between flex-wrap gap-4 mb-4", isRTL && "flex-row-reverse")}>
          <TabsList className="glass-card p-1">
            <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              {t('admin.partnersTable')}
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              {t('admin.metricsDashboard')}
            </TabsTrigger>
          </TabsList>

          {/* Status Filter - Only show on table view */}
          {activeTab === 'table' && (
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder={t('admin.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
                  <SelectItem value="paid">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      {t('admin.markAsPaid')}
                    </span>
                  </SelectItem>
                  <SelectItem value="pending">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      {t('admin.markAsPending')}
                    </span>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      {t('admin.markAsCancelled')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {statusFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <TabsContent value="table" className="mt-0">
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
                ) : filteredInfluencers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {statusFilter !== 'all' ? t('admin.noResultsFilter') : t('admin.noPartners')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInfluencers?.map((influencer) => (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:bg-primary/10"
                          onClick={() => {
                            // Find the original influencer with all referrals for the modal
                            const original = influencers?.find(i => i.id === influencer.id);
                            if (original) setSelectedInfluencer(original);
                          }}
                        >
                          {influencer.referredCount} <Eye className="w-3 h-3 ml-1" />
                        </Button>
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
        </TabsContent>

        <TabsContent value="metrics" className="mt-0">
          <AffiliateMetricsDashboard allReferrals={allReferrals} />
        </TabsContent>
      </Tabs>

      {/* Referrals Detail Modal */}
      <Dialog open={!!selectedInfluencer} onOpenChange={() => setSelectedInfluencer(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {t('admin.referralsFor')} {selectedInfluencer?.full_name || selectedInfluencer?.email}
            </DialogTitle>
            <DialogDescription>
              {t('admin.manageCommissions')}
            </DialogDescription>
          </DialogHeader>
          
          {/* Bulk Actions Bar */}
          {selectedInfluencer && selectedReferrals.size > 0 && (
            <div className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg border border-primary/20 mb-4">
              <span className="text-sm font-medium">
                {selectedReferrals.size} {t('admin.selected')}
              </span>
              <div className="flex items-center gap-2">
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">{t('admin.markAsPaid')}</SelectItem>
                    <SelectItem value="pending">{t('admin.markAsPending')}</SelectItem>
                    <SelectItem value="cancelled">{t('admin.markAsCancelled')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  onClick={handleBulkStatusUpdate}
                  disabled={bulkUpdateStatusMutation.isPending}
                  className="btn-premium text-primary-foreground"
                >
                  <Check className="w-4 h-4 mr-1" />
                  {t('admin.applyBulkAction')}
                </Button>
              </div>
            </div>
          )}

          {selectedInfluencer && selectedInfluencer.referrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedInfluencer && selectedReferrals.size === selectedInfluencer.referrals.length}
                      onCheckedChange={toggleAllReferrals}
                    />
                  </TableHead>
                  <TableHead>{t('admin.referredUser')}</TableHead>
                  <TableHead>{t('admin.plan')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.commission')}</TableHead>
                  <TableHead>{t('admin.date')}</TableHead>
                  <TableHead>{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedInfluencer.referrals.map((referral) => (
                  <TableRow key={referral.id} className={cn("border-border", selectedReferrals.has(referral.id) && "bg-primary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={selectedReferrals.has(referral.id)}
                        onCheckedChange={() => toggleReferralSelection(referral.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {referral.referred_name || t('common.unknown')}
                        </p>
                        <p className="text-xs text-muted-foreground">{referral.referred_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={referral.referred_plan === 'pro' ? 'default' : 'secondary'} className="capitalize">
                        {referral.referred_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={referral.status === 'paid' ? 'default' : 'secondary'}
                        className={referral.status === 'paid' ? 'bg-success/20 text-success border-success/30' : ''}
                      >
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingReferralId === referral.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={editingCommission}
                            onChange={(e) => setEditingCommission(e.target.value)}
                            className="w-20 h-8 text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-success">
                          ${referral.commission_amount.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {editingReferralId === referral.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success hover:bg-success/10 h-8 w-8 p-0"
                            onClick={() => handleSaveCommission(referral.id)}
                            disabled={updateCommissionMutation.isPending}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:bg-muted h-8 w-8 p-0"
                            onClick={handleCancelEditCommission}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:bg-primary/10 h-8 w-8 p-0"
                          onClick={() => handleStartEditCommission(referral.id, referral.commission_amount)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('admin.noReferrals')}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedInfluencer(null);
              setSelectedReferrals(new Set());
            }}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartners;
