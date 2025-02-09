import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe-server';
import { api as WooCommerce } from '@/lib/woocommerce';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Time threshold for considering a payment intent as abandoned (30 minutes)
const PAYMENT_INTENT_TIMEOUT = 30 * 60 * 1000;

async function handleAbandonedPaymentIntent(paymentIntent) {
  try {
    // Check if the payment intent is older than our timeout
    const createdTime = paymentIntent.created * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeDifference = currentTime - createdTime;

    if (
      timeDifference > PAYMENT_INTENT_TIMEOUT &&
      paymentIntent.status === 'requires_payment_method'
    ) {
      // Cancel the abandoned payment intent
      await stripe.paymentIntents.cancel(paymentIntent.id, {
        cancellation_reason: 'abandoned',
      });

      logger.info('Cancelled abandoned payment intent', {
        paymentIntentId: paymentIntent.id,
        cartId: paymentIntent.metadata.cartId,
        timeDifference: Math.round(timeDifference / 1000), // Convert to seconds for logging
      });
    }
  } catch (err) {
    logger.error('Error handling abandoned payment intent:', {
      error: err.message,
      paymentIntentId: paymentIntent.id,
    });
  }
}

async function updateWooCommerceOrder(paymentIntent, status) {
  try {
    // Find orders with this payment intent ID in metadata
    const { data: orders } = await WooCommerce.get('orders', {
      search: paymentIntent.id,
      searchBy: 'meta',
    });

    if (!orders || orders.length === 0) {
      logger.warn('No WooCommerce order found for payment intent', {
        paymentIntentId: paymentIntent.id,
      });
      return;
    }

    const order = orders[0];
    const orderUpdate = {
      status: status,
      meta_data: [
        ...order.meta_data,
        {
          key: 'stripe_payment_status',
          value: paymentIntent.status,
        },
      ],
    };

    await WooCommerce.put(`orders/${order.id}`, orderUpdate);
    logger.info('Updated WooCommerce order status', {
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      status: status,
    });
  } catch (error) {
    logger.error('Error updating WooCommerce order:', {
      error: error.message,
      paymentIntentId: paymentIntent.id,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    if (!sig || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await updateWooCommerceOrder(paymentIntent, 'completed');
        logger.info('Payment succeeded:', { paymentIntentId: paymentIntent.id });
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await updateWooCommerceOrder(failedPayment, 'failed');
        logger.error('Payment failed:', { 
          paymentIntentId: failedPayment.id,
          error: failedPayment.last_payment_error,
        });
        // Check if we should clean up this failed payment intent
        await handleAbandonedPaymentIntent(failedPayment);
        break;

      case 'payment_intent.requires_payment_method':
        // Payment intent has been created but no payment method was provided
        // or the provided payment method failed
        const pendingPayment = event.data.object;
        await updateWooCommerceOrder(pendingPayment, 'pending');
        await handleAbandonedPaymentIntent(pendingPayment);
        break;

      case 'payment_intent.processing':
        const processingPayment = event.data.object;
        await updateWooCommerceOrder(processingPayment, 'processing');
        break;

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object;
        await updateWooCommerceOrder(canceledPayment, 'cancelled');
        break;

      default:
        logger.info('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
