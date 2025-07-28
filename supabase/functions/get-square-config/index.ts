import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Getting Square configuration...');

    const applicationId = Deno.env.get('SQUARE_APPLICATION_ID');
    const environment = Deno.env.get('SQUARE_ENVIRONMENT') || 'production';
    const locationId = Deno.env.get('SQUARE_LOCATION_ID');

    if (!applicationId) {
      console.error('SQUARE_APPLICATION_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Square configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!locationId) {
      console.error('SQUARE_LOCATION_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Square location not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Square config retrieved successfully');

    return new Response(
      JSON.stringify({
        applicationId,
        environment,
        locationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error getting Square config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get Square configuration' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});