import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, purchasePrice, monthlyRent, language } = await req.json();
    
    console.log('Analyzing property:', { address, purchasePrice, monthlyRent, language });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Calculate basic metrics
    const price = parseFloat(purchasePrice);
    const rent = parseFloat(monthlyRent);
    const annualRent = rent * 12;
    const estimatedExpenses = annualRent * 0.40; // 40% expense ratio
    const noi = annualRent - estimatedExpenses;
    const capRate = (noi / price) * 100;
    const downPayment = price * 0.25;
    const annualDebtService = (price * 0.75) * 0.07; // 25% down, 7% interest estimate
    const annualCashFlow = noi - annualDebtService;
    const cashOnCash = (annualCashFlow / downPayment) * 100;
    const onePercentRule = (rent / price) * 100;

    const languageInstructions: Record<string, string> = {
      en: 'Respond in English.',
      pt: 'Responda em Português.',
      fr: 'Répondez en Français.',
      zh: '请用中文回答。',
      it: 'Rispondi in Italiano.',
      es: 'Responde en Español.',
      ar: 'أجب بالعربية.',
    };

    const systemPrompt = `You are PropWealth AI, an expert real estate investment analyst. You help investors make smart property decisions using data-driven analysis. You are direct, confident, and provide actionable insights.

${languageInstructions[language] || languageInstructions.en}

Your analysis style:
- Use the investor's language naturally
- Be concise but thorough
- Highlight both opportunities and risks
- Provide a clear verdict: STRONG BUY, BUY, HOLD, or PASS
- Use relevant emojis sparingly for emphasis
- Consider forced appreciation opportunities
- Mention tax strategies when relevant (1031 exchange, depreciation, etc.)`;

    const userPrompt = `Analyze this investment property:

📍 Address: ${address}
💰 Purchase Price: $${price.toLocaleString()}
🏠 Monthly Rent: $${rent.toLocaleString()}

Pre-calculated Metrics:
- Cap Rate: ${capRate.toFixed(2)}%
- Cash-on-Cash Return: ${cashOnCash.toFixed(2)}%
- Annual NOI: $${noi.toLocaleString()}
- Annual Cash Flow: $${annualCashFlow.toLocaleString()}
- 1% Rule: ${onePercentRule.toFixed(2)}% (${onePercentRule >= 1 ? 'PASSES' : 'FAILS'})
- Estimated Monthly Expenses: $${(estimatedExpenses / 12).toLocaleString()}

Provide:
1. Your VERDICT (STRONG BUY / BUY / HOLD / PASS) with confidence level
2. Key strengths of this deal (2-3 points)
3. Potential risks or concerns (2-3 points)
4. Forced appreciation opportunities
5. One actionable next step for the investor

Keep your response focused and under 300 words.`;

    console.log('Calling Lovable AI Gateway...');

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
    const aiAnalysis = data.choices?.[0]?.message?.content || '';
    
    console.log('AI analysis received, length:', aiAnalysis.length);

    // Determine recommendation based on metrics
    let recommendation = 'hold';
    if (capRate >= 8 && cashOnCash >= 10) {
      recommendation = 'strong_buy';
    } else if (capRate >= 6 && cashOnCash >= 6) {
      recommendation = 'buy';
    } else if (capRate < 4 || cashOnCash < 0) {
      recommendation = 'pass';
    }

    return new Response(JSON.stringify({
      metrics: {
        capRate: capRate.toFixed(2),
        noi: noi.toFixed(0),
        cashOnCash: cashOnCash.toFixed(2),
        monthlyExpenses: (estimatedExpenses / 12).toFixed(0),
        annualCashFlow: annualCashFlow.toFixed(0),
        onePercentRule: onePercentRule.toFixed(2),
        recommendation,
      },
      aiAnalysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-property function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
