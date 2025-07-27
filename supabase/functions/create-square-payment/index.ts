import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  sourceId: string;
  amount: number;
  profileId: string;
  purchaseType: 'photo' | 'package' | 'video' | 'video_package';
  photoId?: string;
  videoId?: string;
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

    // Get user - authentication required
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { sourceId, amount, profileId, purchaseType, photoId, videoId }: PaymentRequest = await req.json()

    console.log('Processing Square payment:', { amount, profileId, purchaseType })

    // Square API configuration
    const squareApplicationId = Deno.env.get('SQUARE_APPLICATION_ID')
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox'

    if (!squareApplicationId || !squareAccessToken) {
      throw new Error('Square credentials not configured')
    }

    const squareApiUrl = squareEnvironment === 'production' 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com'

    // Create payment with Square
    const paymentBody = {
      source_id: sourceId,
      amount_money: {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'USD'
      },
      idempotency_key: crypto.randomUUID()
    }

    const squareResponse = await fetch(`${squareApiUrl}/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify(paymentBody)
    })

    const squareResult = await squareResponse.json()
    
    // Always log the payment attempt for debugging
    console.log('Square payment response:', squareResult)

    if (!squareResponse.ok) {
      console.error('Square payment failed:', squareResult)
      
      // Store failed payment record for tracking and potential refunds
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          transaction_id: squareResult.payment?.id || crypto.randomUUID(),
          profile_id: profileId,
          user_id: user.id,
          amount: amount,
          status: 'failed',
          purchase_type: purchaseType,
          payment_method: 'square',
          photo_id: photoId || null,
          video_id: videoId || null
        })

      if (paymentError) {
        console.error('Failed to store failed payment:', paymentError)
      }

      // Handle specific Square error codes
      const errorCode = squareResult.errors?.[0]?.code
      const errorDetail = squareResult.errors?.[0]?.detail
      
      if (errorCode === 'GENERIC_DECLINE') {
        throw new Error('Payment was declined by your bank. Please check your card details or try a different payment method.')
      } else if (errorCode === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds. Please check your account balance or try a different payment method.')
      } else if (errorCode === 'CARD_EXPIRED') {
        throw new Error('Your card has expired. Please use a different payment method.')
      } else if (errorCode === 'INVALID_CARD') {
        throw new Error('Invalid card information. Please check your card details.')
      } else {
        throw new Error(errorDetail || 'Payment processing failed. Please try again or contact support.')
      }
    }

    const payment = squareResult.payment
    console.log('Square payment processed:', payment.id, 'Status:', payment.status)

    // Check if payment actually succeeded
    if (payment.status === 'FAILED') {
      // Store failed payment record
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          transaction_id: payment.id,
          profile_id: profileId,
          user_id: user.id,
          amount: amount,
          status: 'failed',
          purchase_type: purchaseType,
          payment_method: 'square',
          photo_id: photoId || null,
          video_id: videoId || null
        })

      if (paymentError) {
        console.error('Failed to store failed payment:', paymentError)
      }

      throw new Error('Payment was declined. Please check your card details or try a different payment method.')
    }

    // Store successful payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        transaction_id: payment.id,
        profile_id: profileId,
        user_id: user.id,
        amount: amount,
        status: payment.status === 'COMPLETED' ? 'completed' : 'pending',
        purchase_type: purchaseType,
        payment_method: 'square',
        photo_id: photoId || null,
        video_id: videoId || null
      })

    if (paymentError) {
      console.error('Failed to store payment:', paymentError)
      throw new Error('Payment processed but failed to store record. Please contact support.')
    }

    // If payment is completed, process unlocks
    if (payment.status === 'COMPLETED') {
      if (purchaseType === 'photo' && photoId) {
        const photoIndex = parseInt(photoId)
        await supabaseClient
          .from('photo_unlocks')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            photo_index: photoIndex
          })
      } else if (purchaseType === 'video' && videoId) {
        const videoIndex = parseInt(videoId)
        await supabaseClient
          .from('video_unlocks')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            video_index: videoIndex
          })
      } else if (purchaseType === 'package') {
        // Unlock all photos for this profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('image_urls')
          .eq('id', profileId)
          .single()

        if (profile?.image_urls) {
          const unlocks = profile.image_urls.map((_, index) => ({
            user_id: user.id,
            profile_id: profileId,
            photo_index: index
          }))
          
          await supabaseClient
            .from('photo_unlocks')
            .insert(unlocks)
        }
      } else if (purchaseType === 'video_package') {
        // Unlock all videos for this profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('video_urls')
          .eq('id', profileId)
          .single()

        if (profile?.video_urls) {
          const unlocks = profile.video_urls.map((_, index) => ({
            user_id: user.id,
            profile_id: profileId,
            video_index: index
          }))
          
          await supabaseClient
            .from('video_unlocks')
            .insert(unlocks)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentId: payment.id,
        status: payment.status,
        message: 'Payment processed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Payment processing error:', error)
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