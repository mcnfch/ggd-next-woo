import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

// Initialize WooCommerce API in a way that's compatible with Next.js server components
const getWooCommerceApi = () => {
  return new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
    consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
    consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
    version: 'wc/v3'
  });
};

export async function POST(request) {
  try {
    // Get all payment intents from the last 24 hours
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 24 * 60 * 60;

    const paymentIntents = await stripe.paymentIntents.list({
      created: { gte: oneDayAgo },
      limit: 100
    });

    const cleanupResults = {
      processed: 0,
      cancelled: 0,
      errors: []
    };

    // Process each payment intent
    for (const intent of paymentIntents.data) {
      try {
        cleanupResults.processed++;

        // Only process intents that are still requires_payment_method
        if (intent.status === 'requires_payment_method') {
          const orderId = intent.metadata.wc_order_id;

          // Cancel the payment intent
          await stripe.paymentIntents.cancel(intent.id);
          cleanupResults.cancelled++;

          // If there's an associated WooCommerce order, cancel it
          if (orderId) {
            const WooCommerce = getWooCommerceApi();
            await WooCommerce.put(`orders/${orderId}`, {
              status: 'cancelled'
            });
          }
        }
      } catch (error) {
        console.error(`Error processing intent ${intent.id}:`, error);
        cleanupResults.errors.push({
          intentId: intent.id,
          error: error.message
        });
      }
    }

    return NextResponse.json(cleanupResults);
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
