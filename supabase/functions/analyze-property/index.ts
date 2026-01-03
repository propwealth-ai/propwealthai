import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= DETERMINISTIC CALCULATION FUNCTIONS =============
// These functions ensure consistent math - NO LLM involvement

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
  ownership_type?: string; // "fee_simple" | "leasehold" | "land_lease" | "coop"
  listing_price?: number; // Original listing price from AI extraction
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
  // New validation fields
  price_confidence_score: number;
  price_source: 'user_input' | 'listing_price' | 'ai_estimated';
  validation_warnings: ValidationWarning[];
  expense_warning?: string;
}

function calculateDeterministicMetrics(raw: RawExtractedData, userProvidedPrice?: number, aiExtractedPrice?: number, comparables?: any[]): CalculatedMetrics {
  const validation_warnings: ValidationWarning[] = [];
  
  // ============= STEP 1: OWNERSHIP TYPE VALIDATION =============
  const ownershipType = raw.ownership_type?.toLowerCase() || 'fee_simple';
  const isLeasehold = ownershipType.includes('leasehold') || ownershipType.includes('land_lease') || ownershipType.includes('coop');
  
  if (isLeasehold) {
    validation_warnings.push({
      type: 'leasehold_detected',
      severity: 'critical',
      message: `Property is ${ownershipType.toUpperCase()} - NOT Fee Simple`,
      details: 'Leasehold/Land Lease properties have different valuation metrics. Market averages for Fee Simple properties should NOT be used for comparison.',
    });
  }

  // ============= STEP 2: PRICE SOURCE VALIDATION =============
  // Priority: 1) User input, 2) Listing price, 3) AI estimated (NEVER use AI market estimates)
  let finalPrice = raw.purchase_price;
  let priceSource: 'user_input' | 'listing_price' | 'ai_estimated' = 'ai_estimated';
  
  if (userProvidedPrice && userProvidedPrice > 0) {
    finalPrice = userProvidedPrice;
    priceSource = 'user_input';
  } else if (raw.listing_price && raw.listing_price > 0) {
    finalPrice = raw.listing_price;
    priceSource = 'listing_price';
  }

  // ============= STEP 3: PRICE CONFIDENCE SCORING =============
  let priceConfidenceScore = 100;
  
  if (comparables && comparables.length >= 2) {
    // Calculate median of comparables
    const compPrices = comparables
      .map(c => c.sale_price)
      .filter(p => typeof p === 'number' && p > 0)
      .sort((a, b) => a - b);
    
    if (compPrices.length >= 2) {
      const median = compPrices.length % 2 === 0 
        ? (compPrices[compPrices.length / 2 - 1] + compPrices[compPrices.length / 2]) / 2
        : compPrices[Math.floor(compPrices.length / 2)];
      
      const priceDifferential = Math.abs(finalPrice - median) / median;
      
      // If price differs by more than 50% from median, flag it
      if (priceDifferential > 0.5) {
        priceConfidenceScore = Math.max(0, Math.round(100 - (priceDifferential * 100)));
        validation_warnings.push({
          type: 'price_mismatch',
          severity: 'critical',
          message: `Listing price differs ${Math.round(priceDifferential * 100)}% from comparable median`,
          details: `Listing: $${finalPrice.toLocaleString()}, Comparable Median: $${Math.round(median).toLocaleString()}. This requires MANUAL REVIEW.`,
        });
      } else if (priceDifferential > 0.25) {
        priceConfidenceScore = Math.max(50, Math.round(100 - (priceDifferential * 50)));
        validation_warnings.push({
          type: 'price_mismatch',
          severity: 'warning',
          message: `Listing price differs ${Math.round(priceDifferential * 100)}% from comparable median`,
          details: `Listing: $${finalPrice.toLocaleString()}, Comparable Median: $${Math.round(median).toLocaleString()}. Consider verifying price accuracy.`,
        });
      }
    }
  }

  // ============= STEP 4: EXPENSE SANITY CHECKS =============
  const { estimated_monthly_rent } = raw;
  
  // Extract fees - CRITICAL: Ensure no double-counting
  let hoa_fees_monthly = 0;
  if (raw.hoa_fees && raw.hoa_fees > 0) {
    // Check if HOA seems to be annual (unlikely to be >$1000/month for most properties)
    if (raw.hoa_fees > 2000) {
      // Likely annual - convert to monthly
      hoa_fees_monthly = Math.round(raw.hoa_fees / 12);
      validation_warnings.push({
        type: 'expense_anomaly',
        severity: 'info',
        message: 'HOA fees converted from annual to monthly',
        details: `Original: $${raw.hoa_fees}, Converted: $${hoa_fees_monthly}/month`,
      });
    } else {
      hoa_fees_monthly = raw.hoa_fees;
    }
  }

  // Property taxes - CRITICAL: Must be annual, convert if seems monthly
  let property_taxes_annual = 0;
  if (raw.property_taxes_annual && raw.property_taxes_annual > 0) {
    // If taxes seem too low to be annual, they might be monthly
    if (raw.property_taxes_annual < 500 && finalPrice > 100000) {
      // Likely monthly - convert to annual
      property_taxes_annual = raw.property_taxes_annual * 12;
      validation_warnings.push({
        type: 'expense_anomaly',
        severity: 'warning',
        message: 'Property taxes appear to be monthly - converted to annual',
        details: `Original: $${raw.property_taxes_annual}, Converted: $${property_taxes_annual}/year`,
      });
    } else {
      property_taxes_annual = raw.property_taxes_annual;
    }
  } else {
    // Default: 1.5% of property value annually
    property_taxes_annual = Math.round(finalPrice * 0.015);
  }

  // Insurance - same check
  let insurance_annual = 0;
  if (raw.insurance_annual && raw.insurance_annual > 0) {
    if (raw.insurance_annual < 100 && finalPrice > 100000) {
      // Likely monthly
      insurance_annual = raw.insurance_annual * 12;
    } else {
      insurance_annual = raw.insurance_annual;
    }
  } else {
    // Default: 0.5% of property value annually
    insurance_annual = Math.round(finalPrice * 0.005);
  }

  // ============= STEP 5: CALCULATE OpEx (NO DOUBLE COUNTING) =============
  const annualRent = estimated_monthly_rent * 12;
  
  // OpEx breakdown using industry standards
  const property_management = Math.round(estimated_monthly_rent * 0.10); // 10% of rent
  const vacancy = Math.round(estimated_monthly_rent * 0.06); // 6% vacancy factor
  const maintenance = Math.round(estimated_monthly_rent * 0.05); // 5% maintenance
  const insurance = Math.round(insurance_annual / 12);
  const property_taxes = Math.round(property_taxes_annual / 12);
  
  const opex_breakdown = {
    property_management,
    vacancy,
    maintenance,
    insurance,
    property_taxes,
    hoa_fees: hoa_fees_monthly,
  };
  
  const operating_expenses = property_management + vacancy + maintenance + insurance + property_taxes + hoa_fees_monthly;
  const annual_opex = operating_expenses * 12;

  // ============= EXPENSE RATIO CHECK =============
  const expenseRatio = operating_expenses / estimated_monthly_rent;
  let expense_warning: string | undefined;
  let roiKiller: string | undefined;
  
  if (expenseRatio > 0.6) {
    // Find the biggest expense contributor
    const expenseItems = [
      { name: 'HOA Fees', value: hoa_fees_monthly, percent: (hoa_fees_monthly / operating_expenses) * 100 },
      { name: 'Property Taxes', value: property_taxes, percent: (property_taxes / operating_expenses) * 100 },
      { name: 'Insurance', value: insurance, percent: (insurance / operating_expenses) * 100 },
      { name: 'Property Management', value: property_management, percent: (property_management / operating_expenses) * 100 },
      { name: 'Vacancy', value: vacancy, percent: (vacancy / operating_expenses) * 100 },
      { name: 'Maintenance', value: maintenance, percent: (maintenance / operating_expenses) * 100 },
    ].sort((a, b) => b.value - a.value);
    
    const topExpense = expenseItems[0];
    roiKiller = topExpense.name;
    expense_warning = `${topExpense.name} ($${topExpense.value}/mo) accounts for ${topExpense.percent.toFixed(0)}% of expenses and is severely impacting ROI`;
    
    validation_warnings.push({
      type: 'expense_anomaly',
      severity: 'critical',
      message: `Operating expenses consume ${(expenseRatio * 100).toFixed(0)}% of rental income`,
      details: expense_warning,
      affected_metric: roiKiller,
    });
  } else if (expenseRatio > 0.5) {
    validation_warnings.push({
      type: 'expense_anomaly',
      severity: 'warning',
      message: `Operating expenses consume ${(expenseRatio * 100).toFixed(0)}% of rental income`,
      details: 'This is above the typical 40-50% range. Review individual expense items.',
    });
  }
  
  // ============= STEP 6: CORE FINANCIAL METRICS =============
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
  
  // Debt Service Coverage Ratio
  const debt_service_coverage = annualDebtService > 0 ? Number((net_operating_income_annual / annualDebtService).toFixed(2)) : 0;

  // ============= NEGATIVE CASHFLOW WARNINGS =============
  if (cap_rate < 0) {
    validation_warnings.push({
      type: 'negative_cashflow',
      severity: 'critical',
      message: `NEGATIVE Cap Rate: ${cap_rate}%`,
      details: expense_warning || 'Operating expenses exceed rental income. This property LOSES MONEY before mortgage payments.',
      affected_metric: roiKiller,
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
      details: expense_warning || 'After mortgage payments, this property will DRAIN your cash monthly.',
      affected_metric: roiKiller,
    });
  } else if (cash_on_cash_return < 5) {
    validation_warnings.push({
      type: 'negative_cashflow',
      severity: 'warning',
      message: `Low Cash-on-Cash: ${cash_on_cash_return}%`,
      details: 'Consider if this return justifies the investment risk.',
    });
  }
  
  // Rehab estimate based on description hints
  let rehab_estimate = 5000;
  if (raw.description_hints) {
    const hints = raw.description_hints.join(' ').toLowerCase();
    if (hints.includes('original') || hints.includes('vintage') || hints.includes('investor special')) {
      rehab_estimate = 35000;
    } else if (hints.includes('needs tlc') || hints.includes('as-is') || hints.includes('fixer')) {
      rehab_estimate = 25000;
    } else if (hints.includes('updated') || hints.includes('renovated') || hints.includes('remodeled')) {
      rehab_estimate = 8000;
    } else if (hints.includes('new construction') || hints.includes('move-in ready') || hints.includes('turnkey')) {
      rehab_estimate = 2000;
    } else {
      rehab_estimate = 15000;
    }
  }
  
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
function generateInputHash(url: string, purchasePrice?: number, monthlyRent?: number): string {
  const input = `${url}|${purchasePrice || 'auto'}|${monthlyRent || 'auto'}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Jurisdiction detection from URL or address
function detectJurisdiction(input: string): { code: string; currency: string; taxInfo: string } {
  const urlLower = input.toLowerCase();
  
  if (urlLower.includes('dubizzle') || urlLower.includes('.ae') || urlLower.includes('dubai') || urlLower.includes('abu dhabi') || urlLower.includes('uae')) {
    return { code: 'AE', currency: 'AED', taxInfo: '0% Income Tax, 4% DLD Transfer Fee, No Capital Gains Tax' };
  }
  if (urlLower.includes('zillow') || urlLower.includes('redfin') || urlLower.includes('realtor.com') || urlLower.includes('.us') || /\b(fl|tx|ca|ny|nj|az|nv)\b/i.test(urlLower)) {
    return { code: 'US', currency: 'USD', taxInfo: '1031 Exchange available, Depreciation deductions, State-specific taxes apply' };
  }
  if (urlLower.includes('olx.com.br') || urlLower.includes('zapimoveis') || urlLower.includes('vivareal') || urlLower.includes('brazil') || urlLower.includes('brasil')) {
    return { code: 'BR', currency: 'BRL', taxInfo: 'IRPF on rental income (progressive 7.5%-27.5%), ITBI transfer tax ~3%' };
  }
  if (urlLower.includes('seloger') || urlLower.includes('leboncoin') || urlLower.includes('.fr') || urlLower.includes('paris') || urlLower.includes('france')) {
    return { code: 'FR', currency: 'EUR', taxInfo: 'LMNP status available, Micro-foncier regime, Social charges ~17.2%' };
  }
  if (urlLower.includes('idealista.pt') || urlLower.includes('imovirtual') || urlLower.includes('portugal') || urlLower.includes('lisbon') || urlLower.includes('porto')) {
    return { code: 'PT', currency: 'EUR', taxInfo: 'NHR regime for tax benefits, IMT transfer tax 1-8%, Stamp duty 0.8%' };
  }
  if (urlLower.includes('idealista.com') || urlLower.includes('fotocasa') || urlLower.includes('spain') || urlLower.includes('españa') || urlLower.includes('madrid') || urlLower.includes('barcelona')) {
    return { code: 'ES', currency: 'EUR', taxInfo: 'ITP transfer tax 6-10%, IRPF rental income tax, Regional variations' };
  }
  if (urlLower.includes('immobiliare.it') || urlLower.includes('casa.it') || urlLower.includes('italy') || urlLower.includes('italia') || urlLower.includes('roma') || urlLower.includes('milano')) {
    return { code: 'IT', currency: 'EUR', taxInfo: 'Cedolare secca flat tax 21%, IMU property tax, Regional surcharges' };
  }
  if (urlLower.includes('fang.com') || urlLower.includes('anjuke') || urlLower.includes('lianjia') || urlLower.includes('china') || urlLower.includes('shanghai') || urlLower.includes('beijing')) {
    return { code: 'ZH', currency: 'CNY', taxInfo: 'Deed tax 1-3%, VAT on sales, Rental income tax 5-20%' };
  }
  
  return { code: 'US', currency: 'USD', taxInfo: '1031 Exchange available, Depreciation deductions' };
}

const languageNames: Record<string, string> = {
  en: 'English',
  pt: 'Portuguese (Brazilian)',
  fr: 'French',
  zh: 'Simplified Chinese',
  it: 'Italian',
  es: 'Spanish',
  ar: 'Arabic',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, address, purchasePrice, monthlyRent, language, mode, userId, teamId, forceRefresh } = await req.json();
    
    const inputSource = url || address;
    console.log('Deep Scan analysis:', { inputSource, mode, language, forceRefresh, userPrice: purchasePrice });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // ============= STEP 1: CHECK CACHE =============
    const inputHash = generateInputHash(inputSource, purchasePrice, monthlyRent);
    
    if (!forceRefresh && url) {
      console.log('Checking cache for URL:', url);
      
      const { data: cachedAnalysis, error: cacheError } = await supabase
        .from('property_analyses')
        .select('*')
        .eq('property_url', url)
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
      console.log('Cache MISS - proceeding with fresh analysis');
    }

    const jurisdiction = detectJurisdiction(inputSource);
    const targetLang = languageNames[language] || 'English';

// ============= STEP 2: AI EXTRACTS RAW DATA ONLY =============
    // CRITICAL: Extract unit identifier from URL for precision matching
    // FIXED: Look specifically for APT, UNIT, or # followed by the unit number
    // This regex now correctly matches "APT-7I" instead of "100" from the street address
    const urlUnitMatch = url?.match(/(?:apt|unit|#)[-\s]*([a-zA-Z0-9]+)/i);
    const targetUnit = urlUnitMatch ? urlUnitMatch[1].toUpperCase() : null;
    console.log('Target unit from URL:', targetUnit, '| Full URL:', url);

    const systemPrompt = `You are PropWealth AI Data Extractor. Your ONLY job is to extract raw property data from listings.

=== UNIT SPECIFICITY FILTER (CRITICAL) ===
${targetUnit ? `TARGET UNIT: ${targetUnit}
YOU MUST ONLY EXTRACT DATA FOR THIS SPECIFIC UNIT.
- IGNORE all data from "Similar Homes", "Building Units", "Other Units For Sale" sections
- IGNORE neighbor listings that appear on the same page
- The List Price MUST be for unit ${targetUnit} ONLY
- If you see multiple prices, use ONLY the one in the main listing header for ${targetUnit}` : 'Extract data for the primary listing only.'}

=== PRICE EXTRACTION - ABSOLUTE PRIORITY ORDER (MANDATORY) ===
YOU MUST FOLLOW THIS EXACT ORDER. NO EXCEPTIONS.

1. FIRST (MANDATORY): Find the element with attribute data-testid="price"
   - This is THE ONLY valid source for the listing price
   - Extract the dollar amount from this element EXACTLY as shown
   - Example: <span data-testid="price">$139,000</span> → listing_price = 139000

2. SECOND (if data-testid="price" missing): Find the FIRST large dollar amount in the main listing header
   - This is typically in a <h1>, <h2>, or prominent <span> near the property title
   - It is almost always the SMALLER of multiple prices shown

3. ABSOLUTE REJECTION LIST - NEVER use these as listing_price:
   - "Zestimate" or "Zestimate®" → This is an ESTIMATE, not the listing price
   - "Home Value" or "Estimated Value" → This is an ESTIMATE
   - "Price History" values → These are old prices
   - Prices in "Similar Homes" or "Other Units" sections → Wrong unit
   - ANY price labeled as "estimate", "predicted", or "market value"

=== CO-OP PRICE SANITY CHECK ===
Co-ops (Cooperative apartments) in Manhattan often sell for $100k-$200k despite high Zestimates.
- If ownership_type = "coop" AND you found a price > $350,000
- STOP and RE-SCAN for a lower price in the main header
- Co-ops have LOW purchase prices but HIGH monthly fees (HOA $1500-$3000)
- The lower price is ALWAYS correct for co-ops

=== CRITICAL RULES ===
1. Extract RAW VALUES ONLY. Do NOT calculate any financial metrics.
2. NEVER generate or estimate a "market value" - use the ACTUAL LISTING PRICE ONLY.
3. The "listing_price" field is SACRED - it must be the EXACT price shown for THIS unit in the main header.
4. Detect ownership type (Fee Simple, Leasehold, Land Lease, Co-op).
5. ANTI-HALLUCINATION: If a section shows "Other Units" or "Similar Listings", SKIP IT ENTIRELY.
6. When in doubt, use the LOWER price visible on the page.

JURISDICTION: ${jurisdiction.code}
CURRENCY: ${jurisdiction.currency}

Return a JSON object with this EXACT structure:
{
  "property_id": "string (UUID)",
  "extracted_unit": "string (the unit number you found - e.g. '7I')",
  "raw_data": {
    "purchase_price": number (MUST be EXACTLY the listing price for THIS unit - NOT an estimate),
    "listing_price": number (THE EXACT LIST PRICE shown on the page for THIS unit - REQUIRED),
    "estimated_monthly_rent": number (see RENT EXTRACTION RULES below),
    "rent_zestimate": number or null (look for "Rent Zestimate" specifically),
    "is_rent_estimated": boolean (true if you had to estimate, false if found on page),
    "hoa_fees": number or null (MONTHLY amount only),
    "property_taxes_annual": number or null (ANNUAL amount only),
    "insurance_annual": number or null (ANNUAL amount only),
    "ownership_type": "fee_simple" | "leasehold" | "land_lease" | "coop",
    "property_type": "apartment" | "house" | "commercial" | "land",
    "location_quality": "prime" | "good" | "average" | "developing",
    "beds": number or null,
    "baths": number or null,
    "sqft": number or null,
    "year_built": number or null,
    "description_hints": ["array of keywords"]
  },
  "ai_analysis": {
    "verdict": "BUY" | "NEGOTIATE" | "AVOID",
    "confidence": number (0-100),
    "reasoning": "string (detailed explanation in ${targetLang})",
    "tax_strategy": "string (localized strategy in ${targetLang})",
    "negotiation_script": "string (persuasive script in ${targetLang})",
    "red_flags": ["array in ${targetLang}"],
    "strengths": ["array in ${targetLang}"],
    "forced_appreciation": "string in ${targetLang}",
    "exit_strategies": ["array in ${targetLang}"]
  },
  "rehab_suggestions": [
    {
      "item": "string",
      "estimated_cost": number,
      "value_add": number,
      "priority": "high" | "medium" | "low"
    }
  ],
  "market_comparables": [
    {
      "address": "string",
      "sale_price": number,
      "sale_date": "string",
      "differential": "string in ${targetLang}",
      "beds": number,
      "baths": number,
      "sqft": number
    }
  ]
}

=== RENT EXTRACTION RULES (CRITICAL - NEVER RETURN $0) ===
If no rent is found, you MUST provide an estimate using these priorities:

1. FIRST: Search for "Rent Zestimate" or "Estimated Rent" text on the page
2. SECOND: If sqft is available, calculate: rent = sqft * 2.50 ($/sqft method)
3. THIRD: Calculate: rent = listing_price * 0.01 (1% rule - more conservative)
4. FINAL STEP: Use the LOWER of methods 2 and 3 above

Example: For a 650 sqft co-op at $139,000:
- Method 2: 650 * 2.50 = $1,625/month
- Method 3: 139000 * 0.01 = $1,390/month
- Use: $1,390 (the lower value)

Set "is_rent_estimated": true when you estimate
NEVER return estimated_monthly_rent as 0 - ALWAYS provide a value

=== EXPENSE EXTRACTION RULES (NO DOUBLE COUNTING) ===
- hoa_fees: MONTHLY amount only
- property_taxes_annual: ANNUAL amount only (separate from HOA)
- insurance_annual: ANNUAL amount only
- Separate multi-item "monthly expenses" correctly

=== OWNERSHIP TYPE DETECTION ===
- Look for: "Leasehold", "Land Lease", "Ground Lease", "Co-op", "Cooperative"
- Default to "fee_simple" if not stated
- CRITICAL for valuations!

=== MARKET COMPARABLES RULES ===
1. Return EXACTLY 3 comparables
2. Sort by most recently sold first
3. Limit search to 0.5 miles, similar sqft (+/- 20%)
4. If Leasehold, use ONLY Leasehold comparables
5. NEVER use the target listing as a comparable

ALL text content must be in ${targetLang}.
TAX FRAMEWORK: ${jurisdiction.taxInfo}`;

    const userPrompt = mode === 'deep_scan' && url ? 
      `EXTRACT DATA from this property listing:

URL: ${url}
${targetUnit ? `\n=== CRITICAL: UNIT FILTER ===\nTARGET UNIT: ${targetUnit}\nONLY extract data for unit ${targetUnit}. IGNORE all other units on the page.\n` : ''}
${purchasePrice ? `User Override Price: ${purchasePrice} (USE THIS EXACT VALUE for purchase_price)` : 'EXTRACT the actual listing price shown on the page - do NOT estimate market value'}
${monthlyRent ? `User Override Rent: ${monthlyRent}` : 'If rent is missing, estimate using 1.2% of list price. NEVER return $0.'}

=== EXTRACTION CHECKLIST ===
1. Find the LIST PRICE for ${targetUnit || 'this property'} - put in "listing_price" and "purchase_price"
2. ${purchasePrice ? `Override with user price: ${purchasePrice}` : 'Use listing price - NEVER use AI estimates or market values'}
3. Find rent OR estimate it (min 1.2% of list price) - NEVER $0
4. Detect ownership type (Fee Simple vs Leasehold vs Co-op)
5. Extract expenses WITHOUT double-counting
6. Verify "extracted_unit" matches "${targetUnit || 'main listing'}"

Return valid JSON only.` :
      `EXTRACT DATA for this property:

Property: ${address}
Purchase Price: ${purchasePrice}
Monthly Rent: ${monthlyRent || 'Estimate at 1.2% of purchase price if unknown'}

Return valid JSON only.`;

    console.log('Calling AI for data extraction (temperature=0 for consistency)...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing...');

    let extractedData;
    try {
      extractedData = JSON.parse(aiContent);
    } catch (parseError) {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // ============= STEP 3: PREPARE RAW DATA WITH VALIDATION =============
    // CRITICAL: Unit verification
    const extractedUnit = extractedData.extracted_unit?.toUpperCase();
    if (targetUnit && extractedUnit && extractedUnit !== targetUnit) {
      console.warn(`UNIT MISMATCH! Requested: ${targetUnit}, Extracted: ${extractedUnit}`);
    }

    // PRIORITY: 1) User input, 2) AI listing_price (NEVER estimated market value)
    const aiListingPrice = extractedData.raw_data?.listing_price || 0;
    const aiFallbackPrice = extractedData.raw_data?.purchase_price || 0;
    
    // CRITICAL: Use listing price, never AI estimates
    let finalPrice = purchasePrice || aiListingPrice || aiFallbackPrice;
    const priceSource = purchasePrice ? 'user_input' : (aiListingPrice ? 'listing_price' : 'ai_estimated');
    
    console.log('Price determination:', { 
      userPrice: purchasePrice, 
      aiListingPrice, 
      aiFallbackPrice, 
      finalPrice,
      priceSource 
    });

    // ============= RENT FALLBACK LOGIC (NEVER $0) =============
    // NEW: Use 1% of price OR $2.50/sqft, whichever is LOWER
    let estimatedRent = monthlyRent || extractedData.raw_data?.estimated_monthly_rent || 0;
    let isRentEstimated = extractedData.raw_data?.is_rent_estimated || false;
    const sqft = extractedData.raw_data?.sqft || 0;
    
    // Try rent zestimate first
    const rentZestimate = extractedData.raw_data?.rent_zestimate;
    if (!estimatedRent || estimatedRent === 0) {
      if (rentZestimate && rentZestimate > 0) {
        estimatedRent = rentZestimate;
        isRentEstimated = true;
        console.log('Using Rent Zestimate:', rentZestimate);
      } else {
        // NEW FORMULA: Use the LOWER of 1% of price or $2.50/sqft
        const onePercentRent = Math.round(finalPrice * 0.01);
        const sqftRent = sqft > 0 ? Math.round(sqft * 2.50) : Infinity;
        
        estimatedRent = Math.min(onePercentRent, sqftRent === Infinity ? onePercentRent : sqftRent);
        isRentEstimated = true;
        
        console.log('Rent fallback calculation:', {
          onePercentRent,
          sqftRent: sqft > 0 ? sqftRent : 'N/A (no sqft)',
          finalRent: estimatedRent,
          method: sqft > 0 && sqftRent < onePercentRent ? 'sqft_method' : 'one_percent'
        });
      }
    }

    // FINAL CHECK: Rent should never be $0
    if (!estimatedRent || estimatedRent <= 0) {
      estimatedRent = Math.max(500, Math.round(finalPrice * 0.01)); // Absolute minimum
      isRentEstimated = true;
      console.log('Emergency rent fallback:', estimatedRent);
    }

    const rawData: RawExtractedData = {
      purchase_price: finalPrice,
      listing_price: aiListingPrice || finalPrice,
      estimated_monthly_rent: estimatedRent,
      hoa_fees: extractedData.raw_data?.hoa_fees || 0,
      property_taxes_annual: extractedData.raw_data?.property_taxes_annual,
      insurance_annual: extractedData.raw_data?.insurance_annual,
      property_type: extractedData.raw_data?.property_type,
      location_quality: extractedData.raw_data?.location_quality,
      beds: extractedData.raw_data?.beds,
      baths: extractedData.raw_data?.baths,
      sqft: extractedData.raw_data?.sqft,
      year_built: extractedData.raw_data?.year_built,
      description_hints: extractedData.raw_data?.description_hints || [],
      ownership_type: extractedData.raw_data?.ownership_type || 'fee_simple',
    };

    console.log('Final raw data:', {
      targetUnit,
      extractedUnit,
      finalPrice: rawData.purchase_price,
      listingPrice: rawData.listing_price,
      rent: rawData.estimated_monthly_rent,
      isRentEstimated,
      ownershipType: rawData.ownership_type,
    });
    
    const calculatedMetrics = calculateDeterministicMetrics(
      rawData, 
      purchasePrice, 
      aiFallbackPrice,
      extractedData.market_comparables
    );

    console.log('Validation warnings:', calculatedMetrics.validation_warnings);

    // Calculate suggested offer price (more aggressive if validation warnings exist)
    let suggestedOfferPrice = rawData.purchase_price;
    if (calculatedMetrics.validation_warnings.some(w => w.severity === 'critical')) {
      suggestedOfferPrice = Math.round(rawData.purchase_price * 0.85); // 15% off for critical issues
    } else if (calculatedMetrics.cap_rate < 5 || calculatedMetrics.cash_on_cash_return < 8) {
      suggestedOfferPrice = Math.round(rawData.purchase_price * 0.90);
    } else {
      suggestedOfferPrice = Math.round(rawData.purchase_price * 0.95);
    }

    // Build final response
    const finalResult = {
      property_id: extractedData.property_id || crypto.randomUUID(),
      metadata: {
        source_url: url || address,
        jurisdiction: jurisdiction.code,
        currency_code: jurisdiction.currency,
        property_type: rawData.property_type || 'house',
        location_quality: rawData.location_quality || 'average',
        ownership_type: rawData.ownership_type || 'fee_simple',
        target_unit: targetUnit,
        extracted_unit: extractedUnit,
        unit_match: !targetUnit || targetUnit === extractedUnit,
      },
      financials: {
        purchase_price: rawData.purchase_price,
        listing_price: rawData.listing_price,
        estimated_monthly_rent: rawData.estimated_monthly_rent,
        is_rent_estimated: isRentEstimated,
        ...calculatedMetrics,
        suggested_offer_price: suggestedOfferPrice,
      },
      raw_property_data: {
        beds: rawData.beds,
        baths: rawData.baths,
        sqft: rawData.sqft,
        year_built: rawData.year_built,
      },
      ai_analysis: extractedData.ai_analysis || {
        verdict: 'NEGOTIATE',
        confidence: 75,
        reasoning: 'Analysis based on extracted data',
        tax_strategy: jurisdiction.taxInfo,
        negotiation_script: '',
        red_flags: [],
        strengths: [],
        forced_appreciation: '',
        exit_strategies: [],
      },
      rehab_suggestions: extractedData.rehab_suggestions || [],
      market_comparables: extractedData.market_comparables || [],
    };

    // ============= STEP 4: CACHE THE RESULT =============
    if (url) {
      console.log('Caching analysis result...');
      
      const { error: upsertError } = await supabase
        .from('property_analyses')
        .upsert({
          property_url: url,
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
    }

    // Add debug log for diagnostics
    const debugLog = {
      unit_extraction: {
        target_unit_from_url: targetUnit,
        extracted_unit_from_ai: extractedUnit,
        unit_match: !targetUnit || targetUnit === extractedUnit,
      },
      price_extraction: {
        user_provided_price: purchasePrice || null,
        ai_listing_price: aiListingPrice,
        ai_fallback_price: aiFallbackPrice,
        final_price_used: finalPrice,
        price_source: priceSource,
      },
      rent_extraction: {
        ai_extracted_rent: extractedData.raw_data?.estimated_monthly_rent || 0,
        rent_zestimate: rentZestimate || null,
        final_rent_used: estimatedRent,
        is_estimated: isRentEstimated,
      },
      cache_status: {
        from_cache: false,
        cache_key: inputHash,
      },
    };

    console.log('Debug log:', JSON.stringify(debugLog, null, 2));

    return new Response(JSON.stringify({
      success: true,
      mode: mode || 'quick',
      cached: false,
      debug_log: debugLog,
      ...finalResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Deep Scan function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
