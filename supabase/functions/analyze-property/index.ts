import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Jurisdiction detection from URL or address
function detectJurisdiction(input: string): { code: string; currency: string; taxInfo: string } {
  const urlLower = input.toLowerCase();
  
  // Dubai / UAE
  if (urlLower.includes('dubizzle') || urlLower.includes('.ae') || urlLower.includes('dubai') || urlLower.includes('abu dhabi') || urlLower.includes('uae')) {
    return { code: 'AE', currency: 'AED', taxInfo: '0% Income Tax, 4% DLD Transfer Fee, No Capital Gains Tax' };
  }
  // USA
  if (urlLower.includes('zillow') || urlLower.includes('redfin') || urlLower.includes('realtor.com') || urlLower.includes('.us') || /\b(fl|tx|ca|ny|nj|az|nv)\b/i.test(urlLower)) {
    return { code: 'US', currency: 'USD', taxInfo: '1031 Exchange available, Depreciation deductions, State-specific taxes apply' };
  }
  // Brazil
  if (urlLower.includes('olx.com.br') || urlLower.includes('zapimoveis') || urlLower.includes('vivareal') || urlLower.includes('brazil') || urlLower.includes('brasil')) {
    return { code: 'BR', currency: 'BRL', taxInfo: 'IRPF on rental income (progressive 7.5%-27.5%), ITBI transfer tax ~3%' };
  }
  // France
  if (urlLower.includes('seloger') || urlLower.includes('leboncoin') || urlLower.includes('.fr') || urlLower.includes('paris') || urlLower.includes('france')) {
    return { code: 'FR', currency: 'EUR', taxInfo: 'LMNP status available, Micro-foncier regime, Social charges ~17.2%' };
  }
  // Portugal
  if (urlLower.includes('idealista.pt') || urlLower.includes('imovirtual') || urlLower.includes('portugal') || urlLower.includes('lisbon') || urlLower.includes('porto')) {
    return { code: 'PT', currency: 'EUR', taxInfo: 'NHR regime for tax benefits, IMT transfer tax 1-8%, Stamp duty 0.8%' };
  }
  // Spain
  if (urlLower.includes('idealista.com') || urlLower.includes('fotocasa') || urlLower.includes('spain') || urlLower.includes('españa') || urlLower.includes('madrid') || urlLower.includes('barcelona')) {
    return { code: 'ES', currency: 'EUR', taxInfo: 'ITP transfer tax 6-10%, IRPF rental income tax, Regional variations' };
  }
  // Italy
  if (urlLower.includes('immobiliare.it') || urlLower.includes('casa.it') || urlLower.includes('italy') || urlLower.includes('italia') || urlLower.includes('roma') || urlLower.includes('milano')) {
    return { code: 'IT', currency: 'EUR', taxInfo: 'Cedolare secca flat tax 21%, IMU property tax, Regional surcharges' };
  }
  // China
  if (urlLower.includes('fang.com') || urlLower.includes('anjuke') || urlLower.includes('lianjia') || urlLower.includes('china') || urlLower.includes('shanghai') || urlLower.includes('beijing')) {
    return { code: 'ZH', currency: 'CNY', taxInfo: 'Deed tax 1-3%, VAT on sales, Rental income tax 5-20%' };
  }
  
  // Default to USA
  return { code: 'US', currency: 'USD', taxInfo: '1031 Exchange available, Depreciation deductions' };
}

// Language name mapping for prompts
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
    const { url, address, purchasePrice, monthlyRent, language, mode, userId, teamId } = await req.json();
    
    const inputSource = url || address;
    console.log('Deep Scan analysis:', { inputSource, mode, language });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Detect jurisdiction
    const jurisdiction = detectJurisdiction(inputSource);
    const targetLang = languageNames[language] || 'English';

    // Build the Deep Scan prompt for Gemini 3 Pro
    const systemPrompt = `You are PropWealth AI Deep Scan Engine, an elite real estate investment analyst powered by advanced reasoning capabilities.

YOUR MISSION: Perform comprehensive "Deep Scan" analysis of real estate investments using semantic inference and financial modeling.

JURISDICTION DETECTED: ${jurisdiction.code}
LOCAL CURRENCY: ${jurisdiction.currency}
TAX FRAMEWORK: ${jurisdiction.taxInfo}

CRITICAL INSTRUCTION - LANGUAGE OUTPUT:
ALL text output in the JSON response MUST be in ${targetLang}. This includes:
- All "reasoning" text
- All "tax_strategy" text  
- All "negotiation_script" text
- All items in "red_flags" array
- All items in "strengths" array
- All "market_comparables" address and differential fields
Exception: Numeric values and enum values (BUY/NEGOTIATE/AVOID) remain in English.

You must return a valid JSON object matching this exact schema:
{
  "property_id": "string (generate UUID)",
  "metadata": {
    "source_url": "string",
    "jurisdiction": "${jurisdiction.code}",
    "currency_code": "${jurisdiction.currency}",
    "property_type": "string (inferred: apartment/house/commercial/land)",
    "location_quality": "string (inferred: prime/good/average/developing)"
  },
  "financials": {
    "purchase_price": number,
    "estimated_monthly_rent": number,
    "operating_expenses": number (sum of opex_breakdown items),
    "opex_breakdown": {
      "property_management": number (10% of monthly rent),
      "vacancy": number (6% of monthly rent),
      "maintenance": number (5% of monthly rent),
      "insurance": number (0.5% of property value / 12),
      "property_taxes": number (1.5% of property value / 12)
    },
    "net_operating_income_annual": number (annual rent - annual expenses),
    "cap_rate": number (NOI / Purchase Price * 100),
    "cash_on_cash_return": number,
    "rehab_estimate": number (infer from description: "original kitchen" = moderate rehab, "newly renovated" = minimal),
    "one_percent_rule": number (monthly rent / purchase price * 100),
    "gross_rent_multiplier": number (price / annual rent),
    "debt_service_coverage": number (estimate based on typical financing),
    "suggested_offer_price": number (your recommended offer price based on analysis)
  },
  "ai_analysis": {
    "verdict": "BUY" | "NEGOTIATE" | "AVOID",
    "confidence": number (0-100),
    "reasoning": "string (detailed explanation in ${targetLang}, 100-200 words)",
    "tax_strategy": "string (localized strategy specific to ${jurisdiction.code} in ${targetLang})",
    "negotiation_script": "string (persuasive script for negotiating with seller in ${targetLang})",
    "red_flags": ["array of risk factors in ${targetLang}"],
    "strengths": ["array of positive factors in ${targetLang}"],
    "forced_appreciation": "string (opportunities to add value in ${targetLang})",
    "exit_strategies": ["array of potential exit strategies in ${targetLang}"]
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
      "address": "string (nearby street name or approximate location in ${targetLang})",
      "sale_price": number,
      "sale_date": "string (e.g., 'Nov 2024', 'Last 3 months')",
      "differential": "string (what makes it different, e.g., 'More renovated', 'Larger lot' in ${targetLang})",
      "beds": number (optional),
      "baths": number (optional),
      "sqft": number (optional)
    }
  ]
}

IMPORTANT NEW REQUIREMENTS:
1. Generate exactly 3 realistic market_comparables based on the property's location and type
2. The comparables should justify your suggested_offer_price
3. Calculate opex_breakdown using industry standards (10% mgmt, 6% vacancy, 5% maintenance, etc.)
4. The operating_expenses should be the sum of all opex_breakdown items

SEMANTIC INFERENCE RULES:
1. If description mentions "original", "vintage", "needs TLC", "investor special" → High rehab costs
2. If URL contains premium areas → Apply location premium to value estimates
3. If property is in ${jurisdiction.code} with 0% tax → Emphasize tax-free income in analysis
4. Calculate ALL metrics using standard formulas, do NOT skip any calculations`;

    const userPrompt = mode === 'deep_scan' && url ? 
      `DEEP SCAN REQUEST - Analyze this property listing:

URL: ${url}
${purchasePrice ? `User Provided Price: ${purchasePrice}` : ''}
${monthlyRent ? `User Provided Rent: ${monthlyRent}` : ''}

INSTRUCTIONS:
1. Infer property details from the URL structure and common patterns
2. If price/rent not provided, estimate based on jurisdiction typical values
3. Perform full financial analysis
4. Return ONLY valid JSON matching the schema above
5. ALL text content must be in ${targetLang}` :
      `QUICK ANALYSIS REQUEST:

Property: ${address}
Purchase Price: ${purchasePrice}
Monthly Rent: ${monthlyRent}

Perform full financial analysis and return ONLY valid JSON matching the schema above.
ALL text content must be in ${targetLang}`;

    console.log('Calling Gemini 3 Pro for Deep Scan...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
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
    
    console.log('Deep Scan response received, parsing JSON...');

    // Parse the JSON response
    let deepScanResult;
    try {
      deepScanResult = JSON.parse(aiContent);
    } catch (parseError) {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        deepScanResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // NOTE: Properties are no longer auto-saved. The user must explicitly
    // choose to add an analyzed property to their portfolio via the UI.
    // This gives investors full control over which properties are tracked.

    return new Response(JSON.stringify({
      success: true,
      mode: mode || 'quick',
      ...deepScanResult,
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
