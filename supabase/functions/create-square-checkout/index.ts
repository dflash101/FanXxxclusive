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

    // Get environment variables
    const squareApplicationId = Deno.env.get('SQUARE_APPLICATION_ID')
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'production'
    const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID')

    if (!squareApplicationId || !squareAccessToken || !squareLocationId) {
      throw new Error('Missing Square configuration')
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
    const squareResponse = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify(checkoutRequest)
    })

    if (!squareResponse.ok) {
      const errorData = await squareResponse.json()
      console.error('Square checkout creation failed:', errorData)
      throw new Error('Checkout creation failed')
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