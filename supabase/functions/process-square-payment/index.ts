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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(jwt);
    
    if (userError || !userData.user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const { sourceId, amountMoney, items } = await req.json();

    if (!sourceId || !amountMoney || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Square configuration
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox';
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');

    if (!squareAccessToken || !squareLocationId) {
      console.error('Missing Square configuration');
      return new Response(
        JSON.stringify({ error: 'Payment system configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine Square API URL based on environment
    const squareBaseUrl = squareEnvironment === 'production' 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    // Create payment request to Square
    const paymentRequest = {
      source_id: sourceId,
      amount_money: amountMoney,
      location_id: squareLocationId,
      idempotency_key: crypto.randomUUID(),
      autocomplete: true,
      note: `Purchase of ${items.length} items`
    };

    console.log('Processing Square payment:', {
      amount: amountMoney,
      itemCount: items.length,
      userId: userId
    });

    // Make payment request to Square
    const squareResponse = await fetch(`${squareBaseUrl}/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify(paymentRequest)
    });

    const squareResult = await squareResponse.json();

    if (!squareResponse.ok) {
      console.error('Square payment failed:', squareResult);
      return new Response(
        JSON.stringify({ 
          error: 'Payment failed',
          details: squareResult.errors?.[0]?.detail || 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payment = squareResult.payment;
    
    if (payment.status !== 'COMPLETED') {
      console.error('Payment not completed:', payment.status);
      return new Response(
        JSON.stringify({ 
          error: 'Payment not completed',
          status: payment.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record payment in database
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: userId,
        square_payment_id: payment.id,
        amount_cents: amountMoney.amount,
        currency: amountMoney.currency,
        status: 'completed'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to record payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record purchased items
    const purchasedItems = items.map((item: any) => ({
      payment_id: paymentRecord.id,
      profile_id: item.profileId,
      item_index: item.itemIndex,
      item_type: item.itemType,
      price_cents: item.price
    }));

    const { error: itemsError } = await supabaseClient
      .from('purchased_items')
      .insert(purchasedItems);

    if (itemsError) {
      console.error('Error recording purchased items:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to record purchased items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record user purchases for easy access
    const userPurchases = items.map((item: any) => ({
      user_id: userId,
      profile_id: item.profileId,
      item_index: item.itemIndex,
      item_type: item.itemType,
      payment_id: paymentRecord.id
    }));

    const { error: userPurchasesError } = await supabaseClient
      .from('user_purchases')
      .insert(userPurchases);

    if (userPurchasesError) {
      console.error('Error recording user purchases:', userPurchasesError);
      // Don't fail the request for this, as the main payment was successful
    }

    console.log('Payment completed successfully:', {
      paymentId: payment.id,
      amount: amountMoney.amount,
      itemCount: items.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        amount: amountMoney.amount,
        items: items.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-square-payment:', error);
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