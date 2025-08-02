import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profileImageId, amount } = await req.json()
    console.log('Creating checkout for image:', profileImageId, 'amount:', amount)

    // Get environment variables
    const squareApplicationId = Deno.env.get('SQUARE_APPLICATION_ID')
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'production'
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID')

    // Validate configuration
    if (!squareApplicationId || !squareAccessToken || !squareLocationId) {
      const missing = []
      if (!squareApplicationId) missing.push('SQUARE_APPLICATION_ID')
      if (!squareAccessToken) missing.push('SQUARE_ACCESS_TOKEN')
      if (!squareLocationId) missing.push('SQUARE_LOCATION_ID')
      console.error('Missing Square configuration:', missing)
      throw new Error(`Missing Square configuration: ${missing.join(', ')}`)
    }

    // Validate access token format
    if (!squareAccessToken.startsWith('EAA') && squareEnvironment === 'production') {
      console.error('Invalid production access token format')
      throw new Error('Invalid Square access token format for production')
    }

    if (!squareAccessToken.startsWith('EAAA') && squareEnvironment === 'sandbox') {
      console.error('Invalid sandbox access token format')
      throw new Error('Invalid Square access token format for sandbox')
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Invalid user token')
    }

    console.log('User authenticated:', user.id)

    // Determine Square API base URL
    const baseUrl = squareEnvironment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com'

    // Create unique order ID
    const orderId = crypto.randomUUID()
    
    // Construct webhook URL for payment verification
    const webhookUrl = `${supabaseUrl}/functions/v1/square-webhook`
    const successUrl = `${req.headers.get('origin')}/purchased?success=true&imageId=${profileImageId}&orderId=${orderId}`
    const cancelUrl = `${req.headers.get('origin')}/profile/${profileImageId}?cancelled=true`

    // Create checkout request with proper structure
    const checkoutRequest = {
      idempotency_key: orderId,
      checkout_options: {
        allow_tipping: false,
        ask_for_shipping_address: false,
        merchant_support_email: 'support@yourstore.com'
      },
      order: {
        location_id: squareLocationId,
        reference_id: `img_${profileImageId}_${user.id}`,
        line_items: [
          {
            name: `Premium Profile Image Access`,
            quantity: '1',
            base_price_money: {
              amount: Math.round(amount * 100), // Convert to cents
              currency: 'USD'
            },
            variation_name: `Image #${profileImageId.slice(0, 8)}`,
            metadata: {
              image_id: profileImageId,
              user_id: user.id
            }
          }
        ]
      },
      redirect_url: successUrl,
      webhook_subscription_url: webhookUrl
    }

    console.log('Square API request:', {
      url: `${baseUrl}/v2/online-checkout/payment-links`,
      environment: squareEnvironment,
      locationId: squareLocationId
    })

    // Make request to Square API with updated version
    const squareResponse = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-07-17' // Updated to latest version
      },
      body: JSON.stringify(checkoutRequest)
    })

    const responseText = await squareResponse.text()
    console.log('Square API response status:', squareResponse.status)
    console.log('Square API response:', responseText)

    if (!squareResponse.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }
      
      console.error('Square API Error:', {
        status: squareResponse.status,
        headers: Object.fromEntries(squareResponse.headers.entries()),
        error: errorData
      })
      
      throw new Error(`Square API Error (${squareResponse.status}): ${JSON.stringify(errorData)}`)
    }

    const checkoutData = JSON.parse(responseText)

    // Store pending payment in database
    const { error: insertError } = await supabase
      .from('user_purchases')
      .insert([{
        user_id: user.id,
        profile_image_id: profileImageId,
        purchase_price: amount,
        payment_id: `pending_${orderId}` // Mark as pending
      }])

    if (insertError) {
      console.error('Database insert error:', insertError)
      // Don't fail the checkout, just log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: checkoutData.payment_link.url,
        paymentLinkId: checkoutData.payment_link.id,
        orderId: orderId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Checkout creation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})