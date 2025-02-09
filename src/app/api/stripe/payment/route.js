import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe-server';
import { validatePrice, fromCents } from '@/utils/price';

export async function POST(request) {
  try {
    const { amount, metadata = {} } = await request.json();

    if (!amount || !validatePrice(amount, { min: 1 })) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // If we have an existing payment intent ID in the metadata, try to retrieve and reuse it
    if (metadata.existingPaymentIntentId) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          metadata.existingPaymentIntentId
        );

        // If the intent is still valid and has the same amount, reuse it
        if (
          existingIntent &&
          !['succeeded', 'canceled'].includes(existingIntent.status) &&
          existingIntent.amount === amount
        ) {
          logger.info('Reusing existing payment intent', { 
            paymentIntentId: existingIntent.id 
          });
          return NextResponse.json({
            clientSecret: existingIntent.client_secret,
            paymentIntentId: existingIntent.id,
            amount: fromCents(existingIntent.amount),
          });
        }
      } catch (err) {
        // If the payment intent doesn't exist or there's an error, continue to create a new one
        logger.warn('Failed to retrieve existing payment intent', { 
          error: err.message 
        });
      }
    }

    // Generate an idempotency key based on the cart ID
    const idempotencyKey = metadata.cartId 
      ? `payment_intent_${metadata.cartId}`
      : undefined;

    // Create a new payment intent with idempotency key
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          ...metadata,
          cartId: metadata.cartId,
          amountInDollars: fromCents(amount).toFixed(2),
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    logger.info('Created payment intent', { 
      paymentIntentId: paymentIntent.id,
      cartId: metadata.cartId,
      amount: fromCents(amount),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: fromCents(paymentIntent.amount),
    });
  } catch (err) {
    logger.error('Error creating payment intent:', err);
    return NextResponse.json(
      { error: 'Error creating payment intent' },
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
