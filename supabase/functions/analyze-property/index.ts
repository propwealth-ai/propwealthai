import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= RENTCAST API CONFIGURATION =============
const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1';

// ============= INTERFACES =============
interface RawExtractedData {
  purchase_price: number;
  estimated_monthly_rent: number;
  hoa_fees?: number;
  property_taxes_annual?: number;
  insurance_annual?: number;
  property_type?: string;
  location_quality?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  year_built?: number;
  description_hints?: string[];
  ownership_type?: string;
  listing_price?: number;
}

interface ValidationWarning {
  type: 'price_mismatch' | 'leasehold_detected' | 'expense_anomaly' | 'negative_cashflow' | 'data_quality';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: string;
  affected_metric?: string;
}

interface CalculatedMetrics {
  operating_expenses: number;
  opex_breakdown: {
    property_management: number;
    vacancy: number;
    maintenance: number;
    insurance: number;
    property_taxes: number;
    hoa_fees: number;
  };
  net_operating_income_annual: number;
  cap_rate: number;
  cash_on_cash_return: number;
  one_percent_rule: number;
  gross_rent_multiplier: number;
  debt_service_coverage: number;
  rehab_estimate: number;
  price_confidence_score: number;
  price_source: 'user_input' | 'listing_price' | 'rentcast_avm' | 'estimated';
  validation_warnings: ValidationWarning[];
  expense_warning?: string;
}

interface RentcastRentEstimate {
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
  comparables?: Array<{
    formattedAddress: string;
    price: number;
    squareFootage: number;
    bedrooms: number;
    bathrooms: number;
    daysOnMarket?: number;
    distance?: number;
    correlation?: number;
  }>;
}

interface RentcastValueEstimate {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  comparables?: Array<{
    formattedAddress: string;
    price: number;
    squareFootage: number;
    bedrooms: number;
    bathrooms: number;
    lastSaleDate?: string;
    distance?: number;
    correlation?: number;
  }>;
}

interface RentcastPropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
  features?: string[];
  assessorTaxAmount?: number;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// ============= DETERMINISTIC CALCULATION FUNCTIONS =============
function calculateDeterministicMetrics(
  raw: RawExtractedData, 
  userProvidedPrice?: number, 
  rentcastPrice?: number,
  comparables?: any[],
  userProvidedExpenses?: number
): CalculatedMetrics {
  const validation_warnings: ValidationWarning[] = [];
  
  // ============= OWNERSHIP TYPE VALIDATION =============
  const ownershipType = raw.ownership_type?.toLowerCase() || 'fee_simple';
  const isLeasehold = ownershipType.includes('leasehold') || ownershipType.includes('land_lease') || ownershipType.includes('coop');
  
  if (isLeasehold) {
    validation_warnings.push({
      type: 'leasehold_detected',
      severity: 'critical',
      message: `Property is ${ownershipType.toUpperCase()} - NOT Fee Simple`,
      details: 'Leasehold/Land Lease properties have different valuation metrics.',
    });
  }

  // ============= PRICE SOURCE VALIDATION =============
  let finalPrice = raw.purchase_price;
  let priceSource: 'user_input' | 'listing_price' | 'rentcast_avm' | 'estimated' = 'estimated';
  
  if (userProvidedPrice && userProvidedPrice > 0) {
    finalPrice = userProvidedPrice;
    priceSource = 'user_input';
  } else if (raw.listing_price && raw.listing_price > 0) {
    finalPrice = raw.listing_price;
    priceSource = 'listing_price';
  } else if (rentcastPrice && rentcastPrice > 0) {
    finalPrice = rentcastPrice;
    priceSource = 'rentcast_avm';
  }

  // ============= PRICE CONFIDENCE SCORING =============
  let priceConfidenceScore = 100;
  
  if (comparables && comparables.length >= 2) {
    const compPrices = comparables
      .map(c => c.price || c.sale_price)
      .filter(p => typeof p === 'number' && p > 0)
      .sort((a, b) => a - b);
    
    if (compPrices.length >= 2) {
      const median = compPrices.length % 2 === 0 
        ? (compPrices[compPrices.length / 2 - 1] + compPrices[compPrices.length / 2]) / 2
        : compPrices[Math.floor(compPrices.length / 2)];
      
      const priceDifferential = Math.abs(finalPrice - median) / median;
      
      if (priceDifferential > 0.5) {
        priceConfidenceScore = Math.max(0, Math.round(100 - (priceDifferential * 100)));
        validation_warnings.push({
          type: 'price_mismatch',
          severity: 'critical',
          message: `Price differs ${Math.round(priceDifferential * 100)}% from comparable median`,
          details: `Listing: $${finalPrice.toLocaleString()}, Comparable Median: $${Math.round(median).toLocaleString()}`,
        });
      } else if (priceDifferential > 0.25) {
        priceConfidenceScore = Math.max(50, Math.round(100 - (priceDifferential * 50)));
        validation_warnings.push({
          type: 'price_mismatch',
          severity: 'warning',
          message: `Price differs ${Math.round(priceDifferential * 100)}% from comparable median`,
          details: `Consider verifying price accuracy.`,
        });
      }
    }
  }

  // ============= EXPENSE CALCULATIONS =============
  const { estimated_monthly_rent } = raw;
  
  // If user provided monthly expenses, use them directly
  let operating_expenses: number;
  let opex_breakdown: CalculatedMetrics['opex_breakdown'];
  
  if (userProvidedExpenses && userProvidedExpenses > 0) {
    // User-provided expenses - distribute proportionally as an estimate
    operating_expenses = userProvidedExpenses;
    
    // Create estimated breakdown from user's total
    const taxRatio = 0.30; // ~30% taxes
    const insuranceRatio = 0.15; // ~15% insurance
    const maintenanceRatio = 0.20; // ~20% maintenance
    const managementRatio = 0.25; // ~25% management
    const vacancyRatio = 0.10; // ~10% vacancy
    
    opex_breakdown = {
      property_management: Math.round(userProvidedExpenses * managementRatio),
      vacancy: Math.round(userProvidedExpenses * vacancyRatio),
      maintenance: Math.round(userProvidedExpenses * maintenanceRatio),
      insurance: Math.round(userProvidedExpenses * insuranceRatio),
      property_taxes: Math.round(userProvidedExpenses * taxRatio),
      hoa_fees: 0,
    };
  } else {
    // Calculate expenses from property data
    let hoa_fees_monthly = 0;
    if (raw.hoa_fees && raw.hoa_fees > 0) {
      if (raw.hoa_fees > 2000) {
        hoa_fees_monthly = Math.round(raw.hoa_fees / 12);
      } else {
        hoa_fees_monthly = raw.hoa_fees;
      }
    }

    let property_taxes_annual = raw.property_taxes_annual || Math.round(finalPrice * 0.015);
    let insurance_annual = raw.insurance_annual || Math.round(finalPrice * 0.005);

    // OpEx BREAKDOWN
    const property_management = Math.round(estimated_monthly_rent * 0.10);
    const vacancy = Math.round(estimated_monthly_rent * 0.06);
    const maintenance = Math.round(estimated_monthly_rent * 0.05);
    const insurance = Math.round(insurance_annual / 12);
    const property_taxes = Math.round(property_taxes_annual / 12);
    
    opex_breakdown = {
      property_management,
      vacancy,
      maintenance,
      insurance,
      property_taxes,
      hoa_fees: hoa_fees_monthly,
    };
    
    operating_expenses = property_management + vacancy + maintenance + insurance + property_taxes + hoa_fees_monthly;
  }
  
  const annual_opex = operating_expenses * 12;
  const annualRent = estimated_monthly_rent * 12;

  // ============= EXPENSE RATIO CHECK =============
  const expenseRatio = operating_expenses / estimated_monthly_rent;
  let expense_warning: string | undefined;
  
  if (expenseRatio > 0.6) {
    const expenseItems = [
      { name: 'HOA Fees', value: opex_breakdown.hoa_fees },
      { name: 'Property Taxes', value: opex_breakdown.property_taxes },
      { name: 'Insurance', value: opex_breakdown.insurance },
    ].sort((a, b) => b.value - a.value);
    
    const topExpense = expenseItems[0];
    expense_warning = `${topExpense.name} ($${topExpense.value}/mo) is severely impacting ROI`;
    
    validation_warnings.push({
      type: 'expense_anomaly',
      severity: 'critical',
      message: `Operating expenses consume ${(expenseRatio * 100).toFixed(0)}% of rental income`,
      details: expense_warning,
    });
  }
  
  // ============= CORE FINANCIAL METRICS =============
  const net_operating_income_annual = annualRent - annual_opex;
  const cap_rate = finalPrice > 0 ? Number(((net_operating_income_annual / finalPrice) * 100).toFixed(2)) : 0;
  const one_percent_rule = finalPrice > 0 ? Number(((estimated_monthly_rent / finalPrice) * 100).toFixed(2)) : 0;
  const gross_rent_multiplier = annualRent > 0 ? Number((finalPrice / annualRent).toFixed(2)) : 0;
  
  // Cash on Cash calculation (assuming 20% down, 7% interest, 30yr mortgage)
  const downPayment = finalPrice * 0.20;
  const closingCosts = finalPrice * 0.03;
  const totalCashInvested = downPayment + closingCosts;
  const loanAmount = finalPrice * 0.80;
  const monthlyRate = 0.07 / 12;
  const totalPayments = 360;
  const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
  const annualDebtService = monthlyMortgage * 12;
  const annualCashFlow = net_operating_income_annual - annualDebtService;
  const cash_on_cash_return = totalCashInvested > 0 ? Number(((annualCashFlow / totalCashInvested) * 100).toFixed(2)) : 0;
  
  const debt_service_coverage = annualDebtService > 0 ? Number((net_operating_income_annual / annualDebtService).toFixed(2)) : 0;

  // ============= CASHFLOW WARNINGS =============
  if (cap_rate < 0) {
    validation_warnings.push({
      type: 'negative_cashflow',
      severity: 'critical',
      message: `NEGATIVE Cap Rate: ${cap_rate}%`,
      details: 'Operating expenses exceed rental income.',
    });
  } else if (cap_rate < 4) {
    validation_warnings.push({
      type: 'negative_cashflow',
      severity: 'warning',
      message: `Low Cap Rate: ${cap_rate}%`,
      details: 'Cap rate below 4% indicates poor cashflow potential.',
    });
  }

  if (cash_on_cash_return < 0) {
    validation_warnings.push({
      type: 'negative_cashflow',
      severity: 'critical',
      message: `NEGATIVE Cash-on-Cash: ${cash_on_cash_return}%`,
      details: 'This property will drain cash monthly.',
    });
  }
  
  const rehab_estimate = 15000; // Default estimate
  
  return {
    operating_expenses,
    opex_breakdown,
    net_operating_income_annual,
    cap_rate,
    cash_on_cash_return,
    one_percent_rule,
    gross_rent_multiplier,
    debt_service_coverage,
    rehab_estimate,
    price_confidence_score: priceConfidenceScore,
    price_source: priceSource,
    validation_warnings,
    expense_warning,
  };
}

// Generate hash for cache key
function generateInputHash(address: string, purchasePrice?: number, monthlyRent?: number): string {
  const input = `${address}|${purchasePrice || 'auto'}|${monthlyRent || 'auto'}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Jurisdiction detection from address
function detectJurisdiction(input: string): { code: string; currency: string; taxInfo: string } {
  const inputLower = input.toLowerCase();
  
  if (inputLower.includes('dubai') || inputLower.includes('abu dhabi') || inputLower.includes('uae')) {
    return { code: 'AE', currency: 'AED', taxInfo: '0% Income Tax, 4% DLD Transfer Fee, No Capital Gains Tax' };
  }
  if (/\b(fl|tx|ca|ny|nj|az|nv|usa|united states)\b/i.test(inputLower)) {
    return { code: 'US', currency: 'USD', taxInfo: '1031 Exchange available, Depreciation deductions' };
  }
  if (inputLower.includes('brazil') || inputLower.includes('brasil')) {
    return { code: 'BR', currency: 'BRL', taxInfo: 'IRPF on rental income (progressive 7.5%-27.5%)' };
  }
  if (inputLower.includes('france') || inputLower.includes('paris')) {
    return { code: 'FR', currency: 'EUR', taxInfo: 'LMNP status available, Micro-foncier regime' };
  }
  if (inputLower.includes('portugal') || inputLower.includes('lisbon')) {
    return { code: 'PT', currency: 'EUR', taxInfo: 'NHR regime for tax benefits' };
  }
  
  return { code: 'US', currency: 'USD', taxInfo: '1031 Exchange available, Depreciation deductions' };
}

// ============= RENTCAST API FUNCTIONS =============
async function fetchRentEstimate(address: string, apiKey: string): Promise<RentcastRentEstimate | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `${RENTCAST_BASE_URL}/avm/rent/long-term?address=${encodedAddress}`,
      {
        headers: { 'X-Api-Key': apiKey },
      }
    );
    
    if (!response.ok) {
      console.error('Rentcast rent estimate error:', response.status, await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Rentcast rent estimate fetch error:', error);
    return null;
  }
}

async function fetchValueEstimate(address: string, apiKey: string): Promise<RentcastValueEstimate | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `${RENTCAST_BASE_URL}/avm/value?address=${encodedAddress}`,
      {
        headers: { 'X-Api-Key': apiKey },
      }
    );
    
    if (!response.ok) {
      console.error('Rentcast value estimate error:', response.status, await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Rentcast value estimate fetch error:', error);
    return null;
  }
}

async function fetchPropertyDetails(address: string, apiKey: string): Promise<RentcastPropertyDetails | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `${RENTCAST_BASE_URL}/properties?address=${encodedAddress}`,
      {
        headers: { 'X-Api-Key': apiKey },
      }
    );
    
    if (!response.ok) {
      console.error('Rentcast property details error:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    // Rentcast returns an array, get first result
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('Rentcast property details fetch error:', error);
    return null;
  }
}

// Generate AI-like analysis based on metrics
function generateAnalysis(
  metrics: CalculatedMetrics, 
  rawData: RawExtractedData,
  jurisdiction: { code: string; currency: string; taxInfo: string },
  language: string
): any {
  let verdict: 'BUY' | 'NEGOTIATE' | 'AVOID' = 'NEGOTIATE';
  let confidence = 75;
  
  const criticalWarnings = metrics.validation_warnings.filter(w => w.severity === 'critical');
  
  if (criticalWarnings.length > 0) {
    verdict = 'AVOID';
    confidence = 40;
  } else if (metrics.cap_rate >= 8 && metrics.cash_on_cash_return >= 10 && metrics.one_percent_rule >= 1) {
    verdict = 'BUY';
    confidence = 85;
  } else if (metrics.cap_rate >= 6 && metrics.cash_on_cash_return >= 6) {
    verdict = 'NEGOTIATE';
    confidence = 70;
  } else if (metrics.cap_rate < 4 || metrics.cash_on_cash_return < 0) {
    verdict = 'AVOID';
    confidence = 60;
  }

  const strengths: string[] = [];
  const redFlags: string[] = [];
  
  if (metrics.cap_rate >= 7) strengths.push(`Strong Cap Rate: ${metrics.cap_rate}%`);
  if (metrics.one_percent_rule >= 1) strengths.push(`Passes 1% Rule: ${metrics.one_percent_rule}%`);
  if (metrics.cash_on_cash_return >= 8) strengths.push(`Excellent Cash-on-Cash: ${metrics.cash_on_cash_return}%`);
  if (metrics.debt_service_coverage >= 1.25) strengths.push(`Good DSCR: ${metrics.debt_service_coverage}`);
  
  if (metrics.cap_rate < 5) redFlags.push(`Low Cap Rate: ${metrics.cap_rate}%`);
  if (metrics.one_percent_rule < 0.8) redFlags.push(`Fails 1% Rule: ${metrics.one_percent_rule}%`);
  if (metrics.cash_on_cash_return < 5) redFlags.push(`Low Cash-on-Cash: ${metrics.cash_on_cash_return}%`);
  if (metrics.expense_warning) redFlags.push(metrics.expense_warning);
  
  criticalWarnings.forEach(w => redFlags.push(w.message));

  const reasoning = verdict === 'BUY' 
    ? `This property shows strong investment metrics with a ${metrics.cap_rate}% cap rate and ${metrics.cash_on_cash_return}% cash-on-cash return.`
    : verdict === 'AVOID'
    ? `This property has significant red flags that make it a risky investment. ${redFlags[0] || 'Review the metrics carefully.'}`
    : `This property has potential but requires negotiation. Target price reduction of 5-10% to improve returns.`;

  const negotiationScript = `Based on the analysis, the current asking price yields a ${metrics.cap_rate}% cap rate. 
To achieve a more attractive 8% cap rate, consider offering around $${Math.round(rawData.purchase_price * 0.90).toLocaleString()}. 
Key negotiation points: market comparables, days on market, and any identified issues.`;

  return {
    verdict,
    confidence,
    reasoning,
    tax_strategy: jurisdiction.taxInfo,
    negotiation_script: negotiationScript,
    red_flags: redFlags,
    strengths,
    forced_appreciation: 'Consider cosmetic updates, rent optimization, or expense reduction strategies.',
    exit_strategies: ['Buy and Hold', 'BRRRR Strategy', 'Fix and Flip', '1031 Exchange'],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, address, purchasePrice, monthlyRent, monthlyExpenses, language, mode, userId, teamId, forceRefresh } = await req.json();
    
    // For Rentcast, we need an address - extract from URL or use provided address
    let propertyAddress = address;
    
    // If URL provided, we need to inform user that Rentcast requires an address
    if (url && !address) {
      console.log('URL provided but Rentcast requires address. Attempting to extract...');
      // For now, return an error asking for the address
      // In future, could use a web scraper to extract address from URL
      return new Response(JSON.stringify({
        success: false,
        error: 'address_required',
        message: 'Rentcast API requires a property address. Please use Quick Analysis mode and enter the property address.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!propertyAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'address_required',
        message: 'Please provide a property address for analysis.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Rentcast analysis:', { propertyAddress, mode, language, userPrice: purchasePrice, userRent: monthlyRent, userExpenses: monthlyExpenses });

    const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!RENTCAST_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'RENTCAST_API_KEY not configured. Please add your Rentcast API key.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // ============= CHECK CACHE =============
    const inputHash = generateInputHash(propertyAddress, purchasePrice, monthlyRent);
    
    if (!forceRefresh) {
      console.log('Checking cache for address:', propertyAddress);
      
      const { data: cachedAnalysis, error: cacheError } = await supabase
        .from('property_analyses')
        .select('*')
        .eq('input_hash', inputHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (cachedAnalysis && !cacheError) {
        console.log('Cache HIT - returning stored analysis');
        return new Response(JSON.stringify({
          success: true,
          mode: mode || 'quick',
          cached: true,
          cache_age_minutes: Math.round((Date.now() - new Date(cachedAnalysis.last_updated).getTime()) / 60000),
          ...cachedAnalysis.analysis_json,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('Cache MISS - proceeding with Rentcast API');
    }

    const jurisdiction = detectJurisdiction(propertyAddress);

    // ============= FETCH DATA FROM RENTCAST =============
    console.log('Fetching data from Rentcast API...');
    
    // Fetch all data in parallel
    const [rentEstimate, valueEstimate, propertyDetails] = await Promise.all([
      fetchRentEstimate(propertyAddress, RENTCAST_API_KEY),
      fetchValueEstimate(propertyAddress, RENTCAST_API_KEY),
      fetchPropertyDetails(propertyAddress, RENTCAST_API_KEY),
    ]);

    console.log('Rentcast responses:', {
      rentEstimate: rentEstimate ? 'received' : 'failed',
      valueEstimate: valueEstimate ? 'received' : 'failed',
      propertyDetails: propertyDetails ? 'received' : 'failed',
    });

    // ============= DETERMINE FINAL VALUES =============
    // Priority: User input > Rentcast AVM > Fallback estimate
    let finalPrice = purchasePrice || valueEstimate?.price || 0;
    let priceSource: 'user_input' | 'rentcast_avm' | 'estimated' = 
      purchasePrice ? 'user_input' : (valueEstimate?.price ? 'rentcast_avm' : 'estimated');

    let finalRent = monthlyRent || rentEstimate?.rent || 0;
    let isRentEstimated = !monthlyRent && !rentEstimate?.rent;
    let rentSource = monthlyRent ? 'user_input' : (rentEstimate?.rent ? 'rentcast' : 'estimated');

    // Fallback rent calculation if Rentcast doesn't have data
    if (!finalRent && finalPrice > 0) {
      finalRent = Math.round(finalPrice * 0.01); // 1% rule fallback
      isRentEstimated = true;
      rentSource = 'one_percent_rule';
    }

    // If we still don't have a price, we can't proceed
    if (!finalPrice || finalPrice <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'no_price_data',
        message: 'Could not determine property value. Please enter the purchase price manually.',
        rentcast_data: {
          rent_available: !!rentEstimate,
          value_available: !!valueEstimate,
          details_available: !!propertyDetails,
        },
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get property taxes from Rentcast if available
    const propertyTaxes = propertyDetails?.assessorTaxAmount || Math.round(finalPrice * 0.015);

    // ============= BUILD RAW DATA =============
    const rawData: RawExtractedData = {
      purchase_price: finalPrice,
      listing_price: valueEstimate?.price || finalPrice,
      estimated_monthly_rent: finalRent,
      property_taxes_annual: propertyTaxes,
      insurance_annual: Math.round(finalPrice * 0.005),
      property_type: propertyDetails?.propertyType || 'Single Family',
      beds: propertyDetails?.bedrooms,
      baths: propertyDetails?.bathrooms,
      sqft: propertyDetails?.squareFootage,
      year_built: propertyDetails?.yearBuilt,
      description_hints: propertyDetails?.features || [],
      ownership_type: 'fee_simple',
    };

    console.log('Raw data assembled:', rawData);

    // ============= CALCULATE METRICS =============
    const salesComparables = valueEstimate?.comparables || [];
    const calculatedMetrics = calculateDeterministicMetrics(
      rawData, 
      purchasePrice, 
      valueEstimate?.price,
      salesComparables,
      monthlyExpenses
    );

    console.log('Calculated metrics:', {
      cap_rate: calculatedMetrics.cap_rate,
      cash_on_cash: calculatedMetrics.cash_on_cash_return,
      one_percent_rule: calculatedMetrics.one_percent_rule,
    });

    // ============= GENERATE ANALYSIS =============
    const aiAnalysis = generateAnalysis(calculatedMetrics, rawData, jurisdiction, language || 'en');

    // ============= BUILD MARKET COMPARABLES =============
    const marketComparables = [
      ...(salesComparables.slice(0, 3).map(comp => ({
        address: comp.formattedAddress,
        sale_price: comp.price,
        sale_date: comp.lastSaleDate || 'Recent',
        differential: comp.price > finalPrice ? `+${Math.round((comp.price - finalPrice) / finalPrice * 100)}%` : `${Math.round((comp.price - finalPrice) / finalPrice * 100)}%`,
        beds: comp.bedrooms,
        baths: comp.bathrooms,
        sqft: comp.squareFootage,
      }))),
    ];

    // ============= CALCULATE SUGGESTED OFFER =============
    let suggestedOfferPrice = rawData.purchase_price;
    if (calculatedMetrics.validation_warnings.some(w => w.severity === 'critical')) {
      suggestedOfferPrice = Math.round(rawData.purchase_price * 0.85);
    } else if (calculatedMetrics.cap_rate < 5 || calculatedMetrics.cash_on_cash_return < 8) {
      suggestedOfferPrice = Math.round(rawData.purchase_price * 0.90);
    } else {
      suggestedOfferPrice = Math.round(rawData.purchase_price * 0.95);
    }

    // ============= BUILD FINAL RESPONSE =============
    const finalResult = {
      property_id: crypto.randomUUID(),
      metadata: {
        source: 'rentcast',
        source_url: null,
        jurisdiction: jurisdiction.code,
        currency_code: jurisdiction.currency,
        property_type: rawData.property_type,
        location_quality: 'average',
        ownership_type: 'fee_simple',
        extraction_transparency: {
          data_provider: 'Rentcast',
          rent_estimate_available: !!rentEstimate,
          value_estimate_available: !!valueEstimate,
          property_details_available: !!propertyDetails,
          rent_range: rentEstimate ? { low: rentEstimate.rentRangeLow, high: rentEstimate.rentRangeHigh } : null,
          value_range: valueEstimate ? { low: valueEstimate.priceRangeLow, high: valueEstimate.priceRangeHigh } : null,
        },
      },
      financials: {
        purchase_price: rawData.purchase_price,
        listing_price: rawData.listing_price,
        estimated_monthly_rent: rawData.estimated_monthly_rent,
        is_rent_estimated: isRentEstimated,
        ...calculatedMetrics,
        suggested_offer_price: suggestedOfferPrice,
        data_sources: {
          price: {
            value: rawData.purchase_price,
            source: priceSource,
            confidence_score: priceSource === 'rentcast_avm' ? 0.85 : (priceSource === 'user_input' ? 1.0 : 0.5),
            is_estimated: priceSource === 'estimated',
          },
          rent: {
            value: rawData.estimated_monthly_rent,
            source: rentSource,
            confidence_score: rentSource === 'rentcast' ? 0.85 : (rentSource === 'user_input' ? 1.0 : 0.6),
            is_estimated: isRentEstimated,
          },
          property_taxes: {
            value: rawData.property_taxes_annual,
            source: propertyDetails?.assessorTaxAmount ? 'rentcast' : 'estimated',
            is_estimated: !propertyDetails?.assessorTaxAmount,
            frequency: 'annual',
          },
        },
      },
      raw_property_data: {
        beds: rawData.beds,
        baths: rawData.baths,
        sqft: rawData.sqft,
        year_built: rawData.year_built,
        address: propertyAddress,
        city: propertyDetails?.city,
        state: propertyDetails?.state,
        zip_code: propertyDetails?.zipCode,
      },
      ai_analysis: aiAnalysis,
      rehab_suggestions: [
        { item: 'Kitchen Updates', estimated_cost: 15000, value_add: 25000, priority: 'high' },
        { item: 'Bathroom Refresh', estimated_cost: 8000, value_add: 12000, priority: 'medium' },
        { item: 'Flooring', estimated_cost: 6000, value_add: 10000, priority: 'medium' },
        { item: 'Paint & Curb Appeal', estimated_cost: 3000, value_add: 8000, priority: 'low' },
      ],
      market_comparables: marketComparables,
    };

    // ============= CACHE THE RESULT =============
    console.log('Caching analysis result...');
    
    const { error: upsertError } = await supabase
      .from('property_analyses')
      .upsert({
        property_url: propertyAddress,
        input_hash: inputHash,
        analysis_json: finalResult,
        raw_extracted_data: rawData,
        calculated_metrics: calculatedMetrics,
        last_updated: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'property_url',
      });
    
    if (upsertError) {
      console.error('Cache upsert error:', upsertError);
    } else {
      console.log('Analysis cached successfully');
    }

    return new Response(JSON.stringify({
      success: true,
      mode: mode || 'quick',
      cached: false,
      data_provider: 'rentcast',
      ...finalResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Rentcast analysis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
