// Deep Scan Result Types - PropWealth AI Engine

export interface DeepScanMetadata {
  source_url: string;
  jurisdiction: 'US' | 'BR' | 'FR' | 'PT' | 'AE' | 'ES' | 'IT' | 'ZH';
  currency_code: string;
  property_type?: string;
  location_quality?: string;
}

// Operating Expenses Breakdown
export interface OpExBreakdown {
  property_management: number;
  vacancy: number;
  maintenance: number;
  insurance: number;
  property_taxes: number;
  utilities?: number;
  hoa_fees?: number;
  other?: number;
}

// Market Comparable
export interface MarketComparable {
  address: string;
  sale_price: number;
  sale_date: string;
  differential: string;
  beds?: number;
  baths?: number;
  sqft?: number;
}

export interface DeepScanFinancials {
  purchase_price: number;
  estimated_monthly_rent: number;
  operating_expenses: number;
  opex_breakdown?: OpExBreakdown;
  net_operating_income_annual: number;
  cap_rate: number;
  cash_on_cash_return: number;
  rehab_estimate: number;
  one_percent_rule: number;
  gross_rent_multiplier: number;
  debt_service_coverage: number;
  suggested_offer_price?: number;
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
  market_comparables?: MarketComparable[];
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

// Calculate OpEx breakdown from gross rent (industry standards)
export const calculateOpExBreakdown = (monthlyRent: number, purchasePrice: number): OpExBreakdown => {
  const annualRent = monthlyRent * 12;
  return {
    property_management: Math.round(annualRent * 0.10 / 12), // 10% of rent
    vacancy: Math.round(annualRent * 0.06 / 12), // 6% vacancy
    maintenance: Math.round(annualRent * 0.05 / 12), // 5% maintenance
    insurance: Math.round(purchasePrice * 0.005 / 12), // 0.5% of value annually
    property_taxes: Math.round(purchasePrice * 0.015 / 12), // 1.5% property tax
  };
};

// Calculate 5-year projection
export const calculate5YearProjection = (
  currentValue: number,
  purchasePrice: number,
  downPaymentPercent: number = 20,
  appreciationRate: number = 0.03,
  interestRate: number = 0.07,
  loanTermYears: number = 30
) => {
  const loanAmount = purchasePrice * (1 - downPaymentPercent / 100);
  const monthlyRate = interestRate / 12;
  const totalPayments = loanTermYears * 12;
  
  // Monthly mortgage payment (P&I)
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
  
  const projections = [];
  let remainingBalance = loanAmount;
  
  for (let year = 0; year <= 5; year++) {
    const futureValue = currentValue * Math.pow(1 + appreciationRate, year);
    
    // Calculate remaining balance after 'year' years
    if (year > 0) {
      const paymentsMade = year * 12;
      remainingBalance = loanAmount * 
        (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, paymentsMade)) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }
    
    const equity = futureValue - remainingBalance;
    
    projections.push({
      year,
      propertyValue: Math.round(futureValue),
      loanBalance: Math.round(remainingBalance),
      equity: Math.round(equity),
    });
  }
  
  return {
    projections,
    monthlyPayment: Math.round(monthlyPayment),
    initialEquity: Math.round(purchasePrice * downPaymentPercent / 100),
    finalEquity: projections[5].equity,
    totalAppreciation: projections[5].propertyValue - currentValue,
  };
};
