import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const squareApplicationId = Deno.env.get('SQUARE_APPLICATION_ID')
    const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox'

    if (!squareApplicationId) {
      throw new Error('Square Application ID not configured')
    }

    // For sandbox, use a default location ID, for production you'd get this from Square API
    const locationId = squareEnvironment === 'production' 
      ? 'YOUR_PRODUCTION_LOCATION_ID' // Replace with actual location ID
      : 'sandbox'

    return new Response(
      JSON.stringify({ 
        applicationId: squareApplicationId,
        locationId: locationId,
        environment: squareEnvironment
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Config error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})