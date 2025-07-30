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

    // Create payment request
    const paymentRequest = {
      source_id: 'EXTERNAL', // This will be replaced with actual payment method from frontend
      amount_money: {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'USD'
      },
      location_id: squareLocationId,
      reference_id: `image-${profileImageId}`,
      note: `Purchase of image ${profileImageId}`
    }

    // Make payment to Square
    const squareResponse = await fetch(`${baseUrl}/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify(paymentRequest)
    })

    if (!squareResponse.ok) {
      const errorData = await squareResponse.json()
      console.error('Square payment failed:', errorData)
      throw new Error('Payment processing failed')
    }

    const paymentData = await squareResponse.json()

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
      throw new Error('Invalid user token')
    }

    // Record purchase in database
    const { error: insertError } = await supabase
      .from('user_purchases')
      .insert([{
        user_id: user.id,
        profile_image_id: profileImageId,
        purchase_price: amount,
        payment_id: paymentData.payment.id
      }])

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error('Failed to record purchase')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentId: paymentData.payment.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Payment error:', error)
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