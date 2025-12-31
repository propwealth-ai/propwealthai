import React from 'react';
import { Settings as SettingsIcon, User, Globe, Bell, Shield } from 'lucide-react';
import { useLanguage, LanguageCode } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
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
    </div>
  );
};

export default Settings;
