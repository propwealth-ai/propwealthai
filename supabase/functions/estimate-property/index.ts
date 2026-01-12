import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1';

interface RentcastRentEstimate {
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
}

interface RentcastValueEstimate {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
}

interface RentcastPropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
  assessorTaxAmount?: number;
}

async function fetchRentEstimate(address: string, apiKey: string): Promise<RentcastRentEstimate | null> {
  try {
    const response = await fetch(
      `${RENTCAST_BASE_URL}/avm/rent/long-term?address=${encodeURIComponent(address)}`,
      {
        headers: { 'X-Api-Key': apiKey, 'Accept': 'application/json' },
      }
    );
    
    if (!response.ok) {
      console.log('Rent estimate failed:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching rent estimate:', error);
    return null;
  }
}

async function fetchValueEstimate(address: string, apiKey: string): Promise<RentcastValueEstimate | null> {
  try {
    const response = await fetch(
      `${RENTCAST_BASE_URL}/avm/value?address=${encodeURIComponent(address)}`,
      {
        headers: { 'X-Api-Key': apiKey, 'Accept': 'application/json' },
      }
    );
    
    if (!response.ok) {
      console.log('Value estimate failed:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching value estimate:', error);
    return null;
  }
}

async function fetchPropertyDetails(address: string, apiKey: string): Promise<RentcastPropertyDetails | null> {
  try {
    const response = await fetch(
      `${RENTCAST_BASE_URL}/properties?address=${encodeURIComponent(address)}`,
      {
        headers: { 'X-Api-Key': apiKey, 'Accept': 'application/json' },
      }
    );
    
    if (!response.ok) {
      console.log('Property details failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('Error fetching property details:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    
    if (!address) {
      return new Response(JSON.stringify({
        success: false,
        error: 'address_required',
        message: 'Please provide a property address.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching estimates for:', address);

    const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');
    
    if (!RENTCAST_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'RENTCAST_API_KEY not configured.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all data in parallel
    const [rentEstimate, valueEstimate, propertyDetails] = await Promise.all([
      fetchRentEstimate(address, RENTCAST_API_KEY),
      fetchValueEstimate(address, RENTCAST_API_KEY),
      fetchPropertyDetails(address, RENTCAST_API_KEY),
    ]);

    console.log('Rentcast responses:', {
      rentEstimate: rentEstimate ? 'received' : 'failed',
      valueEstimate: valueEstimate ? 'received' : 'failed',
      propertyDetails: propertyDetails ? 'received' : 'failed',
    });

    const estimatedPrice = valueEstimate?.price || 0;
    const estimatedRent = rentEstimate?.rent || 0;
    
    // Calculate suggested monthly expenses (typically ~35-40% of rent for US properties)
    // Breakdown: Property taxes (~1.5% of price/year), Insurance (~0.5%/year), 
    // Maintenance (~5% rent), Vacancy (~6% rent), Management (~10% rent)
    let suggestedExpenses = 0;
    
    if (estimatedPrice > 0 && estimatedRent > 0) {
      const monthlyTaxes = Math.round((estimatedPrice * 0.015) / 12);
      const monthlyInsurance = Math.round((estimatedPrice * 0.005) / 12);
      const maintenance = Math.round(estimatedRent * 0.05);
      const vacancy = Math.round(estimatedRent * 0.06);
      const management = Math.round(estimatedRent * 0.10);
      
      suggestedExpenses = monthlyTaxes + monthlyInsurance + maintenance + vacancy + management;
    } else if (estimatedRent > 0) {
      // Fallback: ~35% of rent
      suggestedExpenses = Math.round(estimatedRent * 0.35);
    } else if (estimatedPrice > 0) {
      // Very rough estimate based on price only
      suggestedExpenses = Math.round((estimatedPrice * 0.02) / 12);
    }

    // Use property taxes from Rentcast if available
    if (propertyDetails?.assessorTaxAmount) {
      const monthlyTaxes = Math.round(propertyDetails.assessorTaxAmount / 12);
      // Recalculate with actual taxes
      if (estimatedRent > 0) {
        const monthlyInsurance = Math.round((estimatedPrice * 0.005) / 12);
        const maintenance = Math.round(estimatedRent * 0.05);
        const vacancy = Math.round(estimatedRent * 0.06);
        const management = Math.round(estimatedRent * 0.10);
        suggestedExpenses = monthlyTaxes + monthlyInsurance + maintenance + vacancy + management;
      }
    }

    const hasData = estimatedPrice > 0 || estimatedRent > 0;

    return new Response(JSON.stringify({
      success: true,
      hasData,
      estimates: {
        price: estimatedPrice,
        priceRange: valueEstimate ? {
          low: valueEstimate.priceRangeLow,
          high: valueEstimate.priceRangeHigh,
        } : null,
        rent: estimatedRent,
        rentRange: rentEstimate ? {
          low: rentEstimate.rentRangeLow,
          high: rentEstimate.rentRangeHigh,
        } : null,
        monthlyExpenses: suggestedExpenses,
      },
      propertyDetails: propertyDetails ? {
        bedrooms: propertyDetails.bedrooms,
        bathrooms: propertyDetails.bathrooms,
        sqft: propertyDetails.squareFootage,
        yearBuilt: propertyDetails.yearBuilt,
        propertyType: propertyDetails.propertyType,
        annualTaxes: propertyDetails.assessorTaxAmount,
      } : null,
      message: hasData 
        ? 'Estimates retrieved successfully from Rentcast.' 
        : 'No data found for this address. Please enter values manually.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Estimate error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch estimates';
    return new Response(JSON.stringify({
      success: false,
      error: message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
