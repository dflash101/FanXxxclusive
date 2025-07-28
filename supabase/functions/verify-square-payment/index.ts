import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  paymentId: string;
}

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

    const { paymentId }: VerifyRequest = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment from database
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If payment is already completed, return success
    if (payment.status === 'completed') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
          unlocked: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Square credentials
    const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const environment = Deno.env.get('SQUARE_ENVIRONMENT') || 'production';

    if (!accessToken) {
      console.error('Square access token not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const squareUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com' 
      : 'https://connect.squareup.com';

    // Verify payment with Square
    const squareResponse = await fetch(`${squareUrl}/v2/payments/${payment.square_payment_id}`, {
      method: 'GET',
      headers: {
        'Square-Version': '2023-10-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const squareData = await squareResponse.json();

    if (!squareResponse.ok) {
      console.error('Square verification failed:', squareData);
      return new Response(
        JSON.stringify({ 
          error: 'Payment verification failed', 
          details: squareData.errors || 'Unknown error' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const squarePayment = squareData.payment;
    const isCompleted = squarePayment.status === 'COMPLETED';

    // Update payment status in database
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        status: isCompleted ? 'completed' : squarePayment.status.toLowerCase(),
        metadata: {
          ...payment.metadata,
          square_payment: squarePayment,
          verified_at: new Date().toISOString()
        }
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If payment is now completed, create unlock record
    if (isCompleted && payment.status !== 'completed') {
      const unlockType = payment.metadata?.unlock_type || 'photos';
      
      const { error: unlockError } = await supabaseClient
        .from('user_unlocks')
        .insert({
          user_id: user.id,
          profile_id: payment.profile_id,
          unlock_type: unlockType,
          payment_id: payment.id
        });

      if (unlockError && !unlockError.message.includes('duplicate')) {
        console.error('Error creating unlock record:', unlockError);
      } else {
        console.log('Unlock record created successfully');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: squarePayment.status.toLowerCase(),
        unlocked: isCompleted
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: 'Payment verification failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});