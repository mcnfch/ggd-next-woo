import Stripe from 'stripe';

const stripeSecretKey = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY_TEST;

if (!stripeSecretKey) {
  throw new Error('Missing Stripe secret key');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: false,
});

/**
 * Enhanced Stripe API error handler with logging
 */
export function handleStripeError(error) {
  const errorDetails = {
    type: error.type,
    code: error.code,
    message: error.message,
    requestId: error.requestId,
    docUrl: error.doc_url,
  };

  console.error('Stripe API error', errorDetails);

  let result;

  switch (error.type) {
    case 'StripeCardError':
      result = {
        message: error.message,
        status: 402,
        code: error.code,
      };
      break;
    case 'StripeRateLimitError':
      result = {
        message: 'Too many requests. Please try again later.',
        status: 429,
        code: 'rate_limit',
      };
      break;
    case 'StripeInvalidRequestError':
      result = {
        message: 'Invalid request. Please check your input.',
        status: 400,
        code: 'invalid_request',
      };
      break;
    case 'StripeAPIError':
      result = {
        message: 'Unable to process payment. Please try again.',
        status: 500,
        code: 'api_error',
      };
      break;
    case 'StripeConnectionError':
      result = {
        message: 'Network error. Please check your connection.',
        status: 503,
        code: 'connection_error',
      };
      break;
    case 'StripeAuthenticationError':
      result = {
        message: 'Authentication failed. Please contact support.',
        status: 401,
        code: 'authentication_error',
      };
      break;
    default:
      result = {
        message: 'An unexpected error occurred.',
        status: 500,
        code: 'unknown_error',
      };
  }

  return result;
}

/**
 * Monitor payment intent status changes
 */
export async function monitorPaymentIntent(paymentIntent) {
  try {
    console.info('Payment intent status change', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
    });

    // Additional monitoring logic can be added here
    // For example, sending notifications, updating order status, etc.

  } catch (error) {
    console.error('Error monitoring payment intent', {
      error,
      paymentIntentId: paymentIntent.id,
    });
  }
}
