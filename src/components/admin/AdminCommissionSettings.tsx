import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Save, RefreshCw, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CommissionSetting {
  id: string;
  plan_type: string;
  commission_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminCommissionSettings: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');

  // Fetch commission settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .order('commission_amount', { ascending: true });
      
      if (error) throw error;
      return data as CommissionSetting[];
    },
  });

  // Update commission amount mutation
  const updateAmountMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { error } = await supabase
        .from('commission_settings')
        .update({ commission_amount: amount })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-settings'] });
      toast({
        title: t('admin.commissionUpdated'),
        description: t('admin.commissionUpdatedDesc'),
      });
      setEditingId(null);
      setEditingAmount('');
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('admin.commissionUpdateError'),
        variant: 'destructive',
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('commission_settings')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-settings'] });
      toast({
        title: t('admin.settingUpdated'),
        description: t('admin.settingUpdatedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('admin.settingUpdateError'),
        variant: 'destructive',
      });
    },
  });

  const handleStartEdit = (setting: CommissionSetting) => {
    setEditingId(setting.id);
    setEditingAmount(setting.commission_amount.toString());
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const amount = parseFloat(editingAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: t('common.error'),
        description: t('admin.invalidAmount'),
        variant: 'destructive',
      });
      return;
    }
    updateAmountMutation.mutate({ id: editingId, amount });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingAmount('');
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'pro':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pro</Badge>;
      case 'business':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Business</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Enterprise</Badge>;
      default:
        return <Badge variant="outline">{planType}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className={cn("flex items-center gap-2 text-base md:text-lg", isRTL && "flex-row-reverse")}>
          <Settings className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          {t('admin.commissionSettings')}
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {t('admin.commissionSettingsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        {/* Mobile: Cards Layout */}
        <div className="md:hidden space-y-3">
          {settings?.map((setting) => (
            <div key={setting.id} className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPlanBadge(setting.plan_type)}
                  <span className="capitalize text-sm text-muted-foreground">
                    {setting.plan_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: setting.id, isActive: checked })
                    }
                    disabled={toggleActiveMutation.isPending}
                  />
                  <span className={cn(
                    "text-xs",
                    setting.is_active ? "text-primary" : "text-muted-foreground"
                  )}>
                    {setting.is_active ? t('admin.active') : t('admin.inactive')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('admin.commissionAmount')}</span>
                {editingId === setting.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={editingAmount}
                      onChange={(e) => setEditingAmount(e.target.value)}
                      className="w-20 input-executive h-8 text-sm"
                      step="0.01"
                      min="0"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateAmountMutation.isPending}
                      className="btn-premium h-8 w-8 p-0"
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-lg">
                      ${setting.commission_amount.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(setting)}
                      className="h-8 px-2"
                    >
                      <DollarSign className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.planType')}</TableHead>
                <TableHead>{t('admin.commissionAmount')}</TableHead>
                <TableHead>{t('admin.status')}</TableHead>
                <TableHead className="text-right">{t('admin.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings?.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPlanBadge(setting.plan_type)}
                      <span className="capitalize text-muted-foreground">
                        {setting.plan_type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingId === setting.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={editingAmount}
                          onChange={(e) => setEditingAmount(e.target.value)}
                          className="w-24 input-executive"
                          step="0.01"
                          min="0"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateAmountMutation.isPending}
                          className="btn-premium"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <span className="font-bold text-primary text-lg">
                        ${setting.commission_amount.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: setting.id, isActive: checked })
                        }
                        disabled={toggleActiveMutation.isPending}
                      />
                      <span className={cn(
                        "text-sm",
                        setting.is_active ? "text-primary" : "text-muted-foreground"
                      )}>
                        {setting.is_active ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId !== setting.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(setting)}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        {t('admin.editCommission')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-3 md:p-4 bg-secondary/30 rounded-lg">
          <p className="text-xs md:text-sm text-muted-foreground">
            <strong>{t('admin.note')}:</strong> {t('admin.commissionNote')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCommissionSettings;
