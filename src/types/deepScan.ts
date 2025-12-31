// Deep Scan Result Types - PropWealth AI Engine

export interface DeepScanMetadata {
  source_url: string;
  jurisdiction: 'US' | 'BR' | 'FR' | 'PT' | 'AE' | 'ES' | 'IT' | 'ZH';
  currency_code: string;
  property_type?: string;
  location_quality?: string;
}

export interface DeepScanFinancials {
  purchase_price: number;
  estimated_monthly_rent: number;
  operating_expenses: number;
  net_operating_income_annual: number;
  cap_rate: number;
  cash_on_cash_return: number;
  rehab_estimate: number;
  one_percent_rule: number;
  gross_rent_multiplier: number;
  debt_service_coverage: number;
}

export interface RehabSuggestion {
  item: string;
  estimated_cost: number;
  value_add: number;
  priority: 'high' | 'medium' | 'low';
}

export interface DeepScanAIAnalysis {
  verdict: 'BUY' | 'NEGOTIATE' | 'AVOID';
  confidence: number;
  reasoning: string;
  tax_strategy: string;
  negotiation_script: string;
  red_flags: string[];
  strengths: string[];
  forced_appreciation: string;
  exit_strategies: string[];
}

export interface DeepScanResult {
  success: boolean;
  mode: 'quick' | 'deep_scan';
  property_id: string;
  metadata: DeepScanMetadata;
  financials: DeepScanFinancials;
  ai_analysis: DeepScanAIAnalysis;
  rehab_suggestions: RehabSuggestion[];
}

// Jurisdiction display info
export const jurisdictionInfo: Record<string, { flag: string; name: string; currency: string }> = {
  US: { flag: '🇺🇸', name: 'United States', currency: 'USD' },
  BR: { flag: '🇧🇷', name: 'Brazil', currency: 'BRL' },
  FR: { flag: '🇫🇷', name: 'France', currency: 'EUR' },
  PT: { flag: '🇵🇹', name: 'Portugal', currency: 'EUR' },
  AE: { flag: '🇦🇪', name: 'UAE/Dubai', currency: 'AED' },
  ES: { flag: '🇪🇸', name: 'Spain', currency: 'EUR' },
  IT: { flag: '🇮🇹', name: 'Italy', currency: 'EUR' },
  ZH: { flag: '🇨🇳', name: 'China', currency: 'CNY' },
};

// Currency formatting
export const formatCurrency = (value: number, currencyCode: string): string => {
  const localeMap: Record<string, string> = {
    USD: 'en-US',
    BRL: 'pt-BR',
    EUR: 'de-DE',
    AED: 'ar-AE',
    CNY: 'zh-CN',
  };
  
  return new Intl.NumberFormat(localeMap[currencyCode] || 'en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
};
