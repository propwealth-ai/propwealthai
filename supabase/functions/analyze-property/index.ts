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
}

function calculateDeterministicMetrics(raw: RawExtractedData): CalculatedMetrics {
  const { purchase_price, estimated_monthly_rent, hoa_fees = 0, property_taxes_annual, insurance_annual } = raw;
  
  // Fixed calculation formulas - NEVER use AI for these
  const annualRent = estimated_monthly_rent * 12;
  
  // OpEx breakdown using industry standards
  const property_management = Math.round(estimated_monthly_rent * 0.10); // 10% of rent
  const vacancy = Math.round(estimated_monthly_rent * 0.06); // 6% vacancy factor
  const maintenance = Math.round(estimated_monthly_rent * 0.05); // 5% maintenance
  const insurance = insurance_annual ? Math.round(insurance_annual / 12) : Math.round(purchase_price * 0.005 / 12); // 0.5% of value annually
  const property_taxes = property_taxes_annual ? Math.round(property_taxes_annual / 12) : Math.round(purchase_price * 0.015 / 12); // 1.5% default
  const hoa = hoa_fees || 0;
  
  const opex_breakdown = {
    property_management,
    vacancy,
    maintenance,
    insurance,
    property_taxes,
    hoa_fees: hoa,
  };
  
  const operating_expenses = property_management + vacancy + maintenance + insurance + property_taxes + hoa;
  const annual_opex = operating_expenses * 12;
  
  // Core financial metrics - deterministic formulas
  const net_operating_income_annual = annualRent - annual_opex;
  const cap_rate = purchase_price > 0 ? Number(((net_operating_income_annual / purchase_price) * 100).toFixed(2)) : 0;
  const one_percent_rule = purchase_price > 0 ? Number(((estimated_monthly_rent / purchase_price) * 100).toFixed(2)) : 0;
  const gross_rent_multiplier = annualRent > 0 ? Number((purchase_price / annualRent).toFixed(2)) : 0;
  
  // Cash on Cash calculation (assuming 20% down, 7% interest, 30yr mortgage)
  const downPayment = purchase_price * 0.20;
  const closingCosts = purchase_price * 0.03;
  const totalCashInvested = downPayment + closingCosts;
  const loanAmount = purchase_price * 0.80;
  const monthlyRate = 0.07 / 12;
  const totalPayments = 360;
  const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
  const annualDebtService = monthlyMortgage * 12;
  const annualCashFlow = net_operating_income_annual - annualDebtService;
  const cash_on_cash_return = totalCashInvested > 0 ? Number(((annualCashFlow / totalCashInvested) * 100).toFixed(2)) : 0;
  
  // Debt Service Coverage Ratio
  const debt_service_coverage = annualDebtService > 0 ? Number((net_operating_income_annual / annualDebtService).toFixed(2)) : 0;
  
  // Rehab estimate based on description hints
  let rehab_estimate = 5000; // Base minimum
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
      rehab_estimate = 15000; // Default moderate
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
  };
}

// Generate hash for cache key
function generateInputHash(url: string, purchasePrice?: number, monthlyRent?: number): string {
  const input = `${url}|${purchasePrice || 'auto'}|${monthlyRent || 'auto'}`;
  // Simple hash function
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
    console.log('Deep Scan analysis:', { inputSource, mode, language, forceRefresh });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client for cache operations
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
    // The AI's job is ONLY to extract data, NOT to calculate metrics
    const systemPrompt = `You are PropWealth AI Data Extractor. Your ONLY job is to extract raw property data from listings.

CRITICAL: You must extract RAW VALUES ONLY. Do NOT calculate any financial metrics.
The backend system will calculate all metrics (Cap Rate, NOI, etc.) using deterministic formulas.

JURISDICTION: ${jurisdiction.code}
CURRENCY: ${jurisdiction.currency}

Return a JSON object with this EXACT structure:
{
  "property_id": "string (UUID)",
  "raw_data": {
    "purchase_price": number,
    "estimated_monthly_rent": number,
    "hoa_fees": number or null,
    "property_taxes_annual": number or null,
    "insurance_annual": number or null,
    "property_type": "apartment" | "house" | "commercial" | "land",
    "location_quality": "prime" | "good" | "average" | "developing",
    "beds": number or null,
    "baths": number or null,
    "sqft": number or null,
    "year_built": number or null,
    "description_hints": ["array of keywords from listing: 'original', 'renovated', 'needs TLC', etc."]
  },
  "ai_analysis": {
    "verdict": "BUY" | "NEGOTIATE" | "AVOID",
    "confidence": number (0-100),
    "reasoning": "string (detailed explanation in ${targetLang}, 100-200 words)",
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

MARKET COMPARABLES RULES (for deterministic results):
1. Always return EXACTLY 3 comparables
2. Sort by: most recently sold first
3. Limit search radius to 0.5 miles
4. Select properties with SIMILAR square footage (+/- 20%)
5. Use the SAME selection criteria every time

ALL text content must be in ${targetLang}.
TAX FRAMEWORK: ${jurisdiction.taxInfo}`;

    const userPrompt = mode === 'deep_scan' && url ? 
      `EXTRACT DATA from this property listing:

URL: ${url}
${purchasePrice ? `User Override Price: ${purchasePrice}` : ''}
${monthlyRent ? `User Override Rent: ${monthlyRent}` : ''}

INSTRUCTIONS:
1. Extract raw property data from the URL
2. If values not found, estimate based on ${jurisdiction.code} market averages
3. DO NOT calculate financial metrics - just extract raw data
4. Return valid JSON only` :
      `EXTRACT DATA for this property:

Property: ${address}
Purchase Price: ${purchasePrice}
Monthly Rent: ${monthlyRent}

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
        temperature: 0, // CRITICAL: Ensures deterministic output
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

    // ============= STEP 3: CALCULATE METRICS DETERMINISTICALLY =============
    const rawData: RawExtractedData = {
      purchase_price: purchasePrice || extractedData.raw_data?.purchase_price || 0,
      estimated_monthly_rent: monthlyRent || extractedData.raw_data?.estimated_monthly_rent || 0,
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
    };

    console.log('Calculating metrics deterministically...');
    const calculatedMetrics = calculateDeterministicMetrics(rawData);

    // Calculate suggested offer price (90% of asking if metrics are weak)
    const suggestedOfferPrice = calculatedMetrics.cap_rate < 5 || calculatedMetrics.cash_on_cash_return < 8
      ? Math.round(rawData.purchase_price * 0.90)
      : Math.round(rawData.purchase_price * 0.95);

    // Build final response with calculated metrics
    const finalResult = {
      property_id: extractedData.property_id || crypto.randomUUID(),
      metadata: {
        source_url: url || address,
        jurisdiction: jurisdiction.code,
        currency_code: jurisdiction.currency,
        property_type: rawData.property_type || 'house',
        location_quality: rawData.location_quality || 'average',
      },
      financials: {
        purchase_price: rawData.purchase_price,
        estimated_monthly_rent: rawData.estimated_monthly_rent,
        ...calculatedMetrics,
        suggested_offer_price: suggestedOfferPrice,
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
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        }, {
          onConflict: 'property_url',
        });
      
      if (upsertError) {
        console.error('Cache upsert error:', upsertError);
      } else {
        console.log('Analysis cached successfully');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode: mode || 'quick',
      cached: false,
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
