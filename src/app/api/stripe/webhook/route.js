import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

// Use the test key in development, live key in production
const stripeSecretKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY_TEST;

const stripe = new Stripe(stripeSecretKey);

// Initialize WooCommerce API
const WooCommerce = new WooCommerceRestApi.default({
  url: process.env.PUBLIC_HTTP_ENDPOINT,
  consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
  version: 'wc/v3'
});

export async function POST(request) {
  const payload = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature');

  // Get the appropriate webhook secret based on environment
  const webhookSecret = process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;

  if (!webhookSecret) {
    console.error('Missing Stripe webhook secret');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    console.log('Received Stripe webhook event:', event.type);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.wc_order_id;

      if (orderId) {
        try {
          // Update WooCommerce order status to processing
          const response = await WooCommerce.put(`orders/${orderId}`, {
            status: 'processing',
            transaction_id: paymentIntent.id,
            set_paid: true,
            meta_data: [
              {
                key: '_stripe_intent_id',
                value: paymentIntent.id
              },
              {
                key: '_payment_method',
                value: 'stripe'
              },
              {
                key: '_stripe_charge_captured',
                value: 'yes'
              }
            ]
          });

          console.log('Successfully updated WooCommerce order:', orderId, response.data);
        } catch (wcError) {
          console.error('Error updating WooCommerce order:', wcError.response?.data || wcError);
          // Don't throw here - we still want to acknowledge the webhook
        }
      } else {
        console.warn('No WooCommerce order ID found in payment intent metadata');
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.wc_order_id;

      if (orderId) {
        try {
          // Update WooCommerce order status to failed
          const response = await WooCommerce.put(`orders/${orderId}`, {
            status: 'failed',
            transaction_id: paymentIntent.id,
            meta_data: [
              {
                key: '_stripe_intent_id',
                value: paymentIntent.id
              },
              {
                key: '_stripe_failure_reason',
                value: paymentIntent.last_payment_error?.message || 'Payment failed'
              }
            ]
          });

          console.log('Successfully updated WooCommerce order to failed:', orderId, response.data);
        } catch (wcError) {
          console.error('Error updating WooCommerce order status:', wcError.response?.data || wcError);
          // Don't throw here - we still want to acknowledge the webhook
        }
      } else {
        console.warn('No WooCommerce order ID found in payment intent metadata');
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to acknowledge receipt of the webhook
    return NextResponse.json({ 
      received: true,
      error: 'Webhook processed with errors'
    });
  }
}
