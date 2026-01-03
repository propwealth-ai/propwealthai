import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ExternalLink, Calendar, RefreshCw, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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

interface PropertyAnalysis {
  id: string;
  property_url: string;
  analysis_json: {
    verdict?: string;
    verdictReason?: string;
  };
  raw_extracted_data: {
    listing_price?: number;
    rent_estimate?: number;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    address?: string;
  };
  calculated_metrics: {
    noi?: number;
    cap_rate?: number;
    cash_on_cash?: number;
  };
  created_at: string;
  last_updated: string;
  expires_at: string;
}

const AnalysisHistory: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: analyses, isLoading, refetch } = useQuery({
    queryKey: ['analysis-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PropertyAnalysis[];
    },
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('property_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('analysisHistory.deleted'),
        description: t('analysisHistory.deletedDesc'),
      });
      refetch();
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: t('common.error'),
        description: t('analysisHistory.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict?.toLowerCase()) {
      case 'buy':
        return 'text-success bg-success/10 border-success/20';
      case 'hold':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'avoid':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
            <History className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{t('analysisHistory.title')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('analysisHistory.subtitle')}
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="border-primary/50 text-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('analysisHistory.totalAnalyses')}</p>
              <p className="text-2xl font-bold text-foreground">{analyses?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('analysisHistory.validCache')}</p>
              <p className="text-2xl font-bold text-foreground">
                {analyses?.filter(a => !isExpired(a.expires_at)).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('analysisHistory.expiredCache')}</p>
              <p className="text-2xl font-bold text-foreground">
                {analyses?.filter(a => isExpired(a.expires_at)).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis List */}
      {isLoading ? (
        <div className="glass-card p-8 text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : analyses?.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('analysisHistory.noAnalyses')}
          </h3>
          <p className="text-muted-foreground">
            {t('analysisHistory.noAnalysesDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses?.map((analysis) => (
            <div 
              key={analysis.id} 
              className={cn(
                "glass-card p-6 hover:border-primary/30 transition-colors",
                isExpired(analysis.expires_at) && "opacity-60"
              )}
            >
              <div className={cn("flex items-start justify-between gap-4", isRTL && "flex-row-reverse")}>
                <div className="flex-1 min-w-0">
                  {/* Address & URL */}
                  <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
                    <h3 className="font-semibold text-foreground truncate">
                      {analysis.raw_extracted_data?.address || t('analysisHistory.unknownAddress')}
                    </h3>
                    <a 
                      href={analysis.property_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Property Details */}
                  <div className={cn("flex flex-wrap gap-4 text-sm text-muted-foreground mb-4", isRTL && "flex-row-reverse")}>
                    {analysis.raw_extracted_data?.property_type && (
                      <span>{analysis.raw_extracted_data.property_type}</span>
                    )}
                    {analysis.raw_extracted_data?.bedrooms && (
                      <span>{analysis.raw_extracted_data.bedrooms} {t('analyzer.bedrooms')}</span>
                    )}
                    {analysis.raw_extracted_data?.bathrooms && (
                      <span>{analysis.raw_extracted_data.bathrooms} {t('analyzer.bathrooms')}</span>
                    )}
                    {analysis.raw_extracted_data?.square_feet && (
                      <span>{analysis.raw_extracted_data.square_feet.toLocaleString()} sqft</span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className={cn("flex flex-wrap gap-6", isRTL && "flex-row-reverse")}>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t('analyzer.listPrice')}:</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(analysis.raw_extracted_data?.listing_price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm text-muted-foreground">{t('analyzer.capRate')}:</span>
                      <span className="font-semibold text-foreground">
                        {analysis.calculated_metrics?.cap_rate?.toFixed(2) || 'N/A'}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t('analyzer.cashOnCash')}:</span>
                      <span className="font-semibold text-foreground">
                        {analysis.calculated_metrics?.cash_on_cash?.toFixed(2) || 'N/A'}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Verdict & Actions */}
                <div className={cn("flex flex-col items-end gap-3", isRTL && "items-start")}>
                  {/* Verdict Badge */}
                  {analysis.analysis_json?.verdict && (
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium border",
                      getVerdictColor(analysis.analysis_json.verdict)
                    )}>
                      {analysis.analysis_json.verdict}
                    </span>
                  )}

                  {/* Cache Status */}
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    isExpired(analysis.expires_at) 
                      ? "bg-destructive/10 text-destructive" 
                      : "bg-success/10 text-success"
                  )}>
                    {isExpired(analysis.expires_at) ? t('analysisHistory.expired') : t('analysisHistory.cached')}
                  </span>

                  {/* Timestamps */}
                  <div className="text-xs text-muted-foreground text-right">
                    <p>{t('analysisHistory.analyzed')}: {format(new Date(analysis.created_at), 'MMM d, yyyy HH:mm')}</p>
                    <p>{t('analysisHistory.expiresAt')}: {format(new Date(analysis.expires_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(analysis.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('analysisHistory.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('analysisHistory.confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnalysisHistory;
