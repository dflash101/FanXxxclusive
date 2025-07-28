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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const profileId = url.searchParams.get('profileId');

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'Profile ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user unlocks for this profile
    const { data: unlocks, error: unlocksError } = await supabaseClient
      .from('user_unlocks')
      .select('unlock_type, unlocked_at, payment_id')
      .eq('user_id', user.id)
      .eq('profile_id', profileId);

    if (unlocksError) {
      console.error('Error fetching unlocks:', unlocksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch unlock status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's payments for this profile
    const { data: payments, error: paymentsError } = await supabaseClient
      .from('payments')
      .select('id, amount, status, payment_method, created_at, metadata')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const unlockedTypes = unlocks?.map(u => u.unlock_type) || [];

    return new Response(
      JSON.stringify({
        success: true,
        unlocks: {
          photos: unlockedTypes.includes('photos'),
          videos: unlockedTypes.includes('videos'),
          profile: unlockedTypes.includes('profile')
        },
        payments: payments || [],
        unlockHistory: unlocks || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error getting payment status:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get payment status' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});