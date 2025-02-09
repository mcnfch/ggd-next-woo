import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

/**
 * Stripe client-side instance - use this for all client-side operations
 */
const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;

    if (!key) {
      console.error('Stripe publishable key is not set');
      return null;
    }

    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

/**
 * Test card numbers for different scenarios
 */
const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient_funds: '4000000000009995',
  expired: '4000000000000069',
  incorrect_cvc: '4000000000000127',
  processing_error: '4000000000000119',
  incorrect_number: '4242424242424241',
};

export { getStripe, TEST_CARDS };
