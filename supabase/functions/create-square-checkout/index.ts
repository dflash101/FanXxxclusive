import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profileImageId, amount, redirectUrl } = await req.json()
    console.log('Request data:', { profileImageId, amount, redirectUrl })

    // Get environment variables
    const squareApplicationId = Deno.env.get('SQUARE_APPLICATION_ID')
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'production'
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID')

    console.log('Square config:', { 
      hasApplicationId: !!squareApplicationId,
      hasAccessToken: !!squareAccessToken,
      environment: squareEnvironment,
      hasLocationId: !!squareLocationId
    })

    if (!squareApplicationId || !squareAccessToken || !squareLocationId) {
      const missingKeys = []
      if (!squareApplicationId) missingKeys.push('SQUARE_APPLICATION_ID')
      if (!squareAccessToken) missingKeys.push('SQUARE_ACCESS_TOKEN')
      if (!squareLocationId) missingKeys.push('SQUARE_LOCATION_ID')
      console.error('Missing Square configuration keys:', missingKeys)
      throw new Error(`Missing Square configuration: ${missingKeys.join(', ')}`)
    }

    // Determine Square API base URL
    const baseUrl = squareEnvironment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com'

    // Create checkout request
    const checkoutRequest = {
      ask_for_shipping_address: false,
      merchant_support_email: 'support@example.com',
      pre_populate_buyer_email: '',
      pre_populate_shipping_address: {},
      redirect_url: redirectUrl,
      order: {
        location_id: squareLocationId,
        line_items: [
          {
            name: `Profile Image #${profileImageId}`,
            quantity: '1',
            base_price_money: {
              amount: Math.round(amount * 100), // Convert to cents
              currency: 'USD'
            }
          }
        ]
      },
      payment_options: {
        autocomplete: true
      },
      checkout_options: {
        allow_tipping: false,
        custom_fields: [
          {
            title: 'Image ID',
            value: profileImageId
          }
        ]
      }
    }

    // Create checkout session with Square
    console.log('Making Square API request to:', `${baseUrl}/v2/online-checkout/payment-links`)
    console.log('Request payload:', JSON.stringify(checkoutRequest, null, 2))
    
    const squareResponse = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify(checkoutRequest)
    })

    console.log('Square API response status:', squareResponse.status)
    
    if (!squareResponse.ok) {
      const errorData = await squareResponse.json()
      console.error('Square checkout creation failed:', errorData)
      console.error('Full error response:', JSON.stringify(errorData, null, 2))
      throw new Error(`Square API Error (${squareResponse.status}): ${JSON.stringify(errorData)}`)
    }

    const checkoutData = await squareResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: checkoutData.payment_link.url,
        paymentLinkId: checkoutData.payment_link.id
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