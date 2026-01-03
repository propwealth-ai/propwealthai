import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Globe, Bell, Shield, Database, Trash2, RefreshCw } from 'lucide-react';
import { useLanguage, LanguageCode } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
const languages: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const Settings: React.FC = () => {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { profile } = useAuth();
  const { role } = useRBAC();
  const { toast } = useToast();
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ total: number; expired: number } | null>(null);

  const isAdmin = role === 'owner' || role === 'admin';

  const fetchCacheStats = async () => {
    const { data, error } = await supabase
      .from('property_analyses')
      .select('id, expires_at');
    
    if (!error && data) {
      const now = new Date();
      const expired = data.filter(a => new Date(a.expires_at) < now).length;
      setCacheStats({ total: data.length, expired });
    }
  };

  React.useEffect(() => {
    if (isAdmin) {
      fetchCacheStats();
    }
  }, [isAdmin]);

  const handleClearAllCache = async () => {
    setIsClearingCache(true);
    try {
      const { error } = await supabase
        .from('property_analyses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast({
        title: t('settings.cacheCleared'),
        description: t('settings.cacheClearedDesc'),
      });
      setCacheStats({ total: 0, expired: 0 });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: t('common.error'),
        description: t('settings.cacheClearError'),
        variant: 'destructive',
      });
    } finally {
      setIsClearingCache(false);
      setShowClearCacheDialog(false);
    }
  };

  const handleClearExpiredCache = async () => {
    setIsClearingCache(true);
    try {
      const { error } = await supabase
        .from('property_analyses')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;

      toast({
        title: t('settings.expiredCacheCleared'),
        description: t('settings.expiredCacheClearedDesc'),
      });
      fetchCacheStats();
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      toast({
        title: t('common.error'),
        description: t('settings.cacheClearError'),
        variant: 'destructive',
      });
    } finally {
      setIsClearingCache(false);
    }
  };
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className={isRTL ? "text-right" : ""}>
        <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">{t('nav.settings')}</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Profile Section */}
      <div className="glass-card p-6">
        <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Profile</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Full Name
              </label>
              <Input
                defaultValue={profile?.full_name || ''}
                className="input-executive"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Email
              </label>
              <Input
                defaultValue={profile?.email || ''}
                className="input-executive"
                disabled
              />
            </div>
          </div>
          <Button className="btn-premium text-primary-foreground">
            {t('common.save')} Changes
          </Button>
        </div>
      </div>

      {/* Language Section */}
      <div className="glass-card p-6">
        <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{t('common.language')}</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Select your preferred language. The interface will update immediately.
          </p>
          <Select value={language} onValueChange={(val) => setLanguage(val as LanguageCode)}>
            <SelectTrigger className="w-full md:w-64 input-executive">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span>{languages.find(l => l.code === language)?.flag}</span>
                  <span>{languages.find(l => l.code === language)?.name}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {language === 'ar' && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-primary text-sm">
                🎉 RTL mode is now active! The entire interface has flipped to support Arabic reading direction.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="glass-card p-6">
        <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          {[
            { label: 'Email notifications for new deals', desc: 'Get notified when AI finds a matching property' },
            { label: 'Team activity alerts', desc: 'Updates when team members take actions' },
            { label: 'Academy progress reminders', desc: 'Weekly reminders to continue learning' },
            { label: 'Market insights', desc: 'Weekly digest of market trends' },
          ].map((item, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center justify-between p-4 bg-secondary/50 rounded-lg",
                isRTL && "flex-row-reverse"
              )}
            >
              <div className={isRTL ? "text-right" : ""}>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={index < 2} />
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="glass-card p-6">
        <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Security</h2>
        </div>
        
        <div className="space-y-4">
          <div className={cn(
            "flex items-center justify-between p-4 bg-secondary/50 rounded-lg",
            isRTL && "flex-row-reverse"
          )}>
            <div className={isRTL ? "text-right" : ""}>
              <p className="font-medium text-foreground">Two-factor authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" className="border-primary/50 text-primary">
              Enable
            </Button>
          </div>
          
          <div className={cn(
            "flex items-center justify-between p-4 bg-secondary/50 rounded-lg",
            isRTL && "flex-row-reverse"
          )}>
            <div className={isRTL ? "text-right" : ""}>
              <p className="font-medium text-foreground">Change password</p>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
            <Button variant="outline" className="border-border text-muted-foreground">
              Update
            </Button>
          </div>
        </div>
      </div>

      {/* Cache Management Section - Admin Only */}
      {isAdmin && (
        <div className="glass-card p-6">
          <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('settings.cacheManagement')}</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t('settings.cacheManagementDesc')}
            </p>

            {/* Cache Stats */}
            {cacheStats && (
              <div className={cn("flex gap-6 mb-4", isRTL && "flex-row-reverse")}>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{t('settings.totalCached')}:</span>
                  <span className="font-semibold text-foreground">{cacheStats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-warning" />
                  <span className="text-muted-foreground">{t('settings.expiredEntries')}:</span>
                  <span className="font-semibold text-foreground">{cacheStats.expired}</span>
                </div>
              </div>
            )}

            <div className={cn(
              "flex items-center justify-between p-4 bg-secondary/50 rounded-lg",
              isRTL && "flex-row-reverse"
            )}>
              <div className={isRTL ? "text-right" : ""}>
                <p className="font-medium text-foreground">{t('settings.clearExpiredCache')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.clearExpiredCacheDesc')}</p>
              </div>
              <Button 
                variant="outline" 
                className="border-warning/50 text-warning hover:bg-warning/10"
                onClick={handleClearExpiredCache}
                disabled={isClearingCache}
              >
                {isClearingCache ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {t('settings.clearExpired')}
              </Button>
            </div>
            
            <div className={cn(
              "flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20",
              isRTL && "flex-row-reverse"
            )}>
              <div className={isRTL ? "text-right" : ""}>
                <p className="font-medium text-foreground">{t('settings.clearAllCache')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.clearAllCacheDesc')}</p>
              </div>
              <Button 
                variant="destructive"
                onClick={() => setShowClearCacheDialog(true)}
                disabled={isClearingCache}
              >
                {isClearingCache ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {t('settings.clearAll')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Confirmation Dialog */}
      <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.confirmClearCache')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.confirmClearCacheDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllCache}
              disabled={isClearingCache}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearingCache ? t('common.loading') : t('settings.clearAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
