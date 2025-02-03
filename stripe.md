# Stripe Integration Documentation

## Overview
This document provides comprehensive documentation for our Stripe integration, focusing on best practices, security, and implementation details.

## Table of Contents
1. [Architecture](#architecture)
2. [Express Checkout Element](#express-checkout-element)
3. [Payment Methods](#payment-methods)
4. [Security](#security)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [Webhooks](#webhooks)

## Architecture

### File Structure
```
/src
  /lib
    /stripe.ts         # Centralized Stripe configuration
  /components/stripe
    /CheckoutForm.tsx  # Main checkout form component
    /ExpressCheckout.tsx # Express checkout component
  /app/api/stripe
    /webhooks.ts      # Webhook handling
    /payment.ts       # Payment processing
    /checkout.ts      # Checkout session creation
```

### Configuration
```typescript
// /src/lib/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY_TEST
);

export default stripe;
```

## Express Checkout Element

### Setup Requirements
1. HTTPS (required for both development and production)
2. Domain verification in Dashboard
3. Payment method activation in Dashboard
4. Browser/device-specific requirements:
   - Apple Pay: Safari browser & Apple Wallet
   - Google Pay: Chrome & Google Pay account
   - PayPal: PayPal account

### Implementation
```typescript
const elements = stripe.elements({
  mode: 'payment',
  amount: 1099,
  currency: 'usd',
  paymentMethodTypes: ['card', 'apple_pay', 'google_pay', 'paypal'],
  appearance: {
    theme: 'night',
    variables: {
      colorPrimary: '#7c3aed',
      colorBackground: '#1f2937',
      colorText: '#ffffff',
      colorDanger: '#dc2626',
      fontFamily: 'Inter var, sans-serif',
    }
  }
});

const expressCheckoutElement = elements.create('expressCheckout');
expressCheckoutElement.mount('#express-checkout-element');
```

## Payment Methods

### Apple Pay
- Requires domain verification
- Only works in Safari
- Requires Apple Pay certificate
- Automatically handles shipping/billing address collection

### Google Pay
- Works in Chrome and Chromium browsers
- No special certification needed
- Supports dynamic pricing updates
- Handles address collection

### PayPal
- Requires PayPal business account
- Supports both immediate and authorize-only payments
- Handles refunds through Stripe dashboard
- Supports PayPal's buyer protection

### Common Features
- Automatic currency conversion
- Fraud prevention
- Dispute handling
- Refund capabilities

## Security

### Best Practices
1. Never log full card data
2. Use Stripe Elements to avoid PCI compliance requirements
3. Implement proper CORS headers
4. Use webhook signatures
5. Implement rate limiting
6. Use environment-specific API keys

### Key Management
```typescript
// Production Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

// Test Keys
STRIPE_SECRET_KEY_TEST=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
```

## Error Handling

### Client-Side Errors
```typescript
try {
  const { paymentIntent, error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/checkout/complete`,
    },
  });

  if (error) {
    handleError(error);
  }
} catch (e) {
  handleError(e);
}
```

### Server-Side Errors
```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
  });
} catch (err) {
  if (err.type === 'StripeCardError') {
    // Handle card errors
  } else if (err.type === 'StripeInvalidRequestError') {
    // Handle invalid parameters
  } else {
    // Handle unexpected errors
  }
}
```

## Testing

### Test Cards
- `4242424242424242`: Successful payment
- `4000000000003220`: 3D Secure authentication
- `4000000000009995`: Insufficient funds
- `4000000000000002`: Declined card

### Test Mode
1. Use test API keys
2. Enable test clock for subscription testing
3. Use test webhook endpoints
4. Create test PayPal accounts

### Automated Testing
```typescript
describe('Stripe Payment', () => {
  it('should process a successful payment', async () => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: 'usd',
      payment_method: 'pm_card_visa',
      confirm: true,
    });
    
    expect(paymentIntent.status).toBe('succeeded');
  });
});
```

## Webhooks

### Setup
1. Create webhook endpoint
2. Register endpoint URL in Stripe Dashboard
3. Store webhook secret in environment variables
4. Implement signature verification

### Implementation
```typescript
import { buffer } from 'micro';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      webhookSecret
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
```

### Important Events
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`
- `charge.refunded`
- `customer.subscription.updated`

## Additional Resources
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Express Checkout Element Guide](https://stripe.com/docs/elements/express-checkout)
- [Testing Guide](https://stripe.com/docs/testing)
- [Webhook Guide](https://stripe.com/docs/webhooks)
- [Security Best Practices](https://stripe.com/docs/security)
