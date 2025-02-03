# Stripe API Reference Documentation

## Core API Concepts

### Authentication
```typescript
// Server-side
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Client-side
const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
```

### Rate Limits
- **Request Rate**: 100 requests per second
- **Concurrent Requests**: 25 concurrent requests
- **Webhook Rate**: 100 events per second
- **Idempotency Keys**: Required for POST requests

### Error Types
1. `StripeCardError`: Failed payment
2. `StripeInvalidRequestError`: Invalid parameters
3. `StripeAuthenticationError`: Invalid API key
4. `StripeAPIError`: API errors
5. `StripeConnectionError`: Network issues
6. `StripeRateLimitError`: Too many requests

## Payment Intents API

### Create Payment Intent
```typescript
// /src/app/api/stripe/payment/route.ts
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { amount, currency = 'usd' } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret })
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
}
```

### Update Payment Intent
```typescript
const paymentIntent = await stripe.paymentIntents.update(
  'pi_123456',
  {
    amount: 2000,
    metadata: { order_id: '123' },
  }
);
```

### Confirm Payment Intent
```typescript
const paymentIntent = await stripe.paymentIntents.confirm(
  'pi_123456',
  {
    payment_method: 'pm_card_visa',
    return_url: 'https://example.com/order/123/complete',
  }
);
```

## Checkout Sessions API

### Create Checkout Session
```typescript
// /src/app/api/stripe/checkout/route.ts
export async function POST(req: Request) {
  try {
    const { lineItems } = await req.json();

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.PUBLIC_DOMAIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_DOMAIN}/checkout/canceled`,
      automatic_tax: { enabled: true },
    });

    return new Response(JSON.stringify({ url: session.url }));
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
}
```

### Retrieve Checkout Session
```typescript
const session = await stripe.checkout.sessions.retrieve(
  'cs_test_123456',
  {
    expand: ['line_items', 'payment_intent'],
  }
);
```

## Webhook Events API

### Handle Webhook Events
```typescript
// /src/app/api/stripe/webhooks/route.ts
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }));
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
}
```

### Important Webhook Events
```typescript
type WebhookEvent =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted';
```

## Error Handling

### Client-Side Error Handling
```typescript
// /src/components/stripe/CheckoutForm.tsx
const handleSubmit = async (event: FormEvent) => {
  event.preventDefault();
  setError(null);
  setProcessing(true);

  try {
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    }
  } catch (e) {
    setError('An unexpected error occurred.');
    setProcessing(false);
  }
};
```

### Server-Side Error Handling
```typescript
// /src/lib/stripe/error-handler.ts
export function handleStripeError(error: any) {
  switch (error.type) {
    case 'StripeCardError':
      return {
        message: error.message,
        status: 402,
        code: error.code,
      };
    case 'StripeInvalidRequestError':
      return {
        message: 'Invalid parameters provided',
        status: 400,
        code: error.code,
      };
    case 'StripeAuthenticationError':
      return {
        message: 'Authentication with Stripe failed',
        status: 401,
        code: error.code,
      };
    case 'StripeRateLimitError':
      return {
        message: 'Too many requests, please try again later',
        status: 429,
        code: error.code,
      };
    default:
      return {
        message: 'Something went wrong',
        status: 500,
        code: 'unknown_error',
      };
  }
}
```

## Testing

### Test Cards
```typescript
const TEST_CARDS = {
  success: '4242424242424242',
  requires3DSecure: '4000000000003220',
  declinedCard: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
  incorrectCVC: '4000000000000127',
  processingError: '4000000000000119',
} as const;
```

### Test Webhook Events
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

## Rate Limiting

### Implementation
```typescript
// /src/lib/stripe/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const stripeRateLimit = rateLimit({
  store: new RedisStore({
    // Redis configuration
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});
```

## API Response Types

### Payment Intent Response
```typescript
interface PaymentIntentResponse {
  clientSecret: string;
  id: string;
  status: PaymentIntentStatus;
  amount: number;
  currency: string;
  created: number;
  metadata: Record<string, string>;
}

type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';
```

### Checkout Session Response
```typescript
interface CheckoutSessionResponse {
  id: string;
  url: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  customer: string | null;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
}
```

## Additional Resources
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
- [Stripe React Components](https://github.com/stripe/stripe-react)
