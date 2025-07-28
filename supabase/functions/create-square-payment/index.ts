import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  profileId: string;
  amount: number;
  unlockType: string;
  sourceId: string;
  verificationToken?: string;
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

    const { profileId, amount, unlockType, sourceId, verificationToken }: PaymentRequest = await req.json();

    if (!profileId || !amount || !unlockType || !sourceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Square credentials
    const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const environment = Deno.env.get('SQUARE_ENVIRONMENT') || 'production';
    const locationId = Deno.env.get('SQUARE_LOCATION_ID');

    if (!accessToken || !locationId) {
      console.error('Square credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const squareUrl = environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com' 
      : 'https://connect.squareup.com';

    // Create payment request
    const paymentRequest = {
      source_id: sourceId,
      verification_token: verificationToken,
      amount_money: {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'USD'
      },
      location_id: locationId,
      idempotency_key: `${user.id}-${profileId}-${unlockType}-${Date.now()}`,
      note: `Unlock ${unlockType} for profile ${profileId}`
    };

    console.log('Creating Square payment:', paymentRequest);

    // Create payment with Square
    const squareResponse = await fetch(`${squareUrl}/v2/payments`, {
      method: 'POST',
      headers: {
        'Square-Version': '2023-10-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentRequest),
    });

    const squareData = await squareResponse.json();

    if (!squareResponse.ok) {
      console.error('Square payment failed:', squareData);
      return new Response(
        JSON.stringify({ 
          error: 'Payment failed', 
          details: squareData.errors || 'Unknown error' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payment = squareData.payment;
    console.log('Square payment created:', payment);

    // Store payment in database
    const { data: dbPayment, error: dbError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        amount: amount,
        currency: 'USD',
        payment_method: 'square',
        square_payment_id: payment.id,
        status: payment.status === 'COMPLETED' ? 'completed' : 'pending',
        metadata: {
          square_payment: payment,
          unlock_type: unlockType
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error storing payment:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If payment is completed, create unlock record
    if (payment.status === 'COMPLETED') {
      const { error: unlockError } = await supabaseClient
        .from('user_unlocks')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          unlock_type: unlockType,
          payment_id: dbPayment.id
        });

      if (unlockError) {
        console.error('Error creating unlock record:', unlockError);
      } else {
        console.log('Unlock record created successfully');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: dbPayment.id,
        square_payment_id: payment.id,
        status: payment.status,
        unlocked: payment.status === 'COMPLETED'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: 'Payment processing failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});