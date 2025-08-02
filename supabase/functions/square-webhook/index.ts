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
    const webhookBody = await req.text()
    console.log('Received Square webhook:', webhookBody)

    // Parse the webhook payload
    const webhookData = JSON.parse(webhookBody)
    
    // Verify webhook signature (in production, you should verify this)
    const merchantId = webhookData.merchant_id
    const eventType = webhookData.type
    
    console.log('Webhook event type:', eventType)
    console.log('Merchant ID:', merchantId)

    if (eventType === 'payment.updated') {
      const payment = webhookData.data.object.payment
      const orderId = payment.order_id
      const paymentId = payment.id
      const status = payment.status
      
      console.log('Payment update:', { orderId, paymentId, status })

      if (status === 'COMPLETED') {
        // Get order details to find the image and user
        const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')
        const squareEnvironment = Deno.env.get('SQUARE_ENVIRONMENT') || 'production'
        
        const baseUrl = squareEnvironment === 'sandbox' 
          ? 'https://connect.squareupsandbox.com'
          : 'https://connect.squareup.com'

        // Fetch order details
        const orderResponse = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${squareAccessToken}`,
            'Square-Version': '2024-07-17'
          }
        })

        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          const order = orderData.order
          const referenceId = order.reference_id // format: img_{imageId}_{userId}
          
          if (referenceId && referenceId.startsWith('img_')) {
            const parts = referenceId.split('_')
            const imageId = parts.slice(1, -1).join('_') // Handle UUIDs with underscores
            const userId = parts[parts.length - 1]
            
            console.log('Processing completed payment:', { imageId, userId, paymentId })
            
            // Update database
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            const supabase = createClient(supabaseUrl, supabaseServiceKey)

            // Update the pending purchase record
            const { error: updateError } = await supabase
              .from('user_purchases')
              .update({ payment_id: paymentId })
              .eq('user_id', userId)
              .eq('profile_image_id', imageId)
              .like('payment_id', 'pending_%')

            if (updateError) {
              console.error('Error updating purchase record:', updateError)
              
              // If update failed, try to insert a new record
              const { error: insertError } = await supabase
                .from('user_purchases')
                .insert([{
                  user_id: userId,
                  profile_image_id: imageId,
                  purchase_price: (order.total_money?.amount || 499) / 100, // Convert from cents
                  payment_id: paymentId
                }])

              if (insertError) {
                console.error('Error inserting purchase record:', insertError)
              } else {
                console.log('Successfully inserted purchase record')
              }
            } else {
              console.log('Successfully updated purchase record')
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
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