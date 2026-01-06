import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Handshake, CreditCard, ShieldCheck, Wallet, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminPartners from '@/components/admin/AdminPartners';
import AdminTransactions from '@/components/admin/AdminTransactions';
import AdminWithdrawals from '@/components/admin/AdminWithdrawals';
import AdminCommissionSettings from '@/components/admin/AdminCommissionSettings';

const Admin: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { isAdmin, isLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">{t('admin.verifying')}</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: 'overview', label: t('admin.overview'), icon: LayoutDashboard },
    { id: 'users', label: t('admin.users'), icon: Users },
    { id: 'partners', label: t('admin.partners'), icon: Handshake },
    { id: 'transactions', label: t('admin.transactions'), icon: CreditCard },
    { id: 'withdrawals', label: t('admin.withdrawals'), icon: Wallet },
    { id: 'settings', label: t('admin.settings'), icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-bold text-foreground">{t('admin.title')}</h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto glass-card p-1 h-auto flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                isRTL && "flex-row-reverse"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="mt-0">
            <AdminOverview />
          </TabsContent>
          <TabsContent value="users" className="mt-0">
            <AdminUsers />
          </TabsContent>
          <TabsContent value="partners" className="mt-0">
            <AdminPartners />
          </TabsContent>
          <TabsContent value="transactions" className="mt-0">
            <AdminTransactions />
          </TabsContent>
          <TabsContent value="withdrawals" className="mt-0">
            <AdminWithdrawals />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <AdminCommissionSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Admin;
