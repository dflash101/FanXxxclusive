import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    )

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { paymentId } = await req.json()

    if (!paymentId) {
      throw new Error('Payment ID is required')
    }

    console.log('Verifying Square payment:', paymentId)

    // Square API configuration
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox'

    if (!squareAccessToken) {
      throw new Error('Square credentials not configured')
    }

    const squareApiUrl = squareEnvironment === 'production' 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com'

    // Get payment from Square
    const squareResponse = await fetch(`${squareApiUrl}/v2/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${squareAccessToken}`,
        'Square-Version': '2023-10-18'
      }
    })

    const squareResult = await squareResponse.json()

    if (!squareResponse.ok) {
      console.error('Square payment verification failed:', squareResult)
      throw new Error('Payment verification failed')
    }

    const payment = squareResult.payment
    console.log('Square payment status:', payment.status)

    // Update payment record
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({ 
        status: payment.status === 'COMPLETED' ? 'completed' : 'failed' 
      })
      .eq('transaction_id', paymentId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update payment:', updateError)
      throw new Error('Failed to update payment record')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        status: payment.status,
        completed: payment.status === 'COMPLETED'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})