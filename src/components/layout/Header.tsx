import React, { useState, useEffect } from 'react';
import { Bell, TrendingUp } from 'lucide-react';
import { useLanguage, LanguageCode } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface HeaderProps {
  collapsed: boolean;
}

const languages: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const Header: React.FC<HeaderProps> = ({ collapsed }) => {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const [netWorth, setNetWorth] = useState(0);
  const [netWorthChange, setNetWorthChange] = useState(0);

  useEffect(() => {
    if (profile?.team_id) {
      fetchNetWorth();
    }
  }, [profile?.team_id]);

  const fetchNetWorth = async () => {
    const { data: properties } = await supabase
      .from('properties')
      .select('current_value, purchase_price');

    if (properties && properties.length > 0) {
      const totalValue = properties.reduce((sum, p) => sum + (p.current_value || p.purchase_price || 0), 0);
      const totalInvested = properties.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
      const equity = totalValue - totalInvested;
      const change = totalInvested > 0 ? ((equity / totalInvested) * 100) : 0;
      
      setNetWorth(totalValue);
      setNetWorthChange(change);
    }
  };

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 z-40 transition-all duration-300",
        isRTL ? (collapsed ? "left-20" : "left-64") : (collapsed ? "left-20" : "left-64"),
        isRTL && "flex-row-reverse"
      )}
      style={{ 
        left: isRTL ? 0 : (collapsed ? '5rem' : '16rem'),
        right: isRTL ? (collapsed ? '5rem' : '16rem') : 0
      }}
    >
      {/* Net Worth Display */}
      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className={isRTL ? "text-right" : ""}>
            <p className="text-xs text-muted-foreground">{t('dashboard.netWorth')}</p>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <span className="text-xl font-bold text-money">
                ${netWorth.toLocaleString()}
              </span>
              {netWorthChange !== 0 && (
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  netWorthChange >= 0 ? "text-primary" : "text-destructive"
                )}>
                  <TrendingUp className="w-3 h-3" />
                  {netWorthChange >= 0 ? '+' : ''}{netWorthChange.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
        {/* Language Selector */}
        <Select value={language} onValueChange={(val) => setLanguage(val as LanguageCode)}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span>{languages.find(l => l.code === language)?.flag}</span>
                <span className="text-sm">{languages.find(l => l.code === language)?.name}</span>
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

        {/* Notifications */}
        <button className="relative w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
