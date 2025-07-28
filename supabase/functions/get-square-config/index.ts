import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Square configuration from secrets
    const squareApplicationId = Deno.env.get('SQUARE_APPLICATION_ID');
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');
    const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox';

    if (!squareApplicationId || !squareLocationId) {
      console.error('Missing Square configuration');
      return new Response(
        JSON.stringify({ 
          error: 'Square configuration not available',
          details: 'Missing application ID or location ID'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Square config retrieved successfully', {
      environment: squareEnvironment,
      hasApplicationId: !!squareApplicationId,
      hasLocationId: !!squareLocationId
    });

    return new Response(
      JSON.stringify({
        applicationId: squareApplicationId,
        locationId: squareLocationId,
        environment: squareEnvironment
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-square-config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});