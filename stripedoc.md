# Stripe Integration Documentation Reference

## Payment Intent Creation

Before displaying the Elements form, you must create a PaymentIntent on your server:

```javascript
// Server-side
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099, // amount in cents
  currency: 'usd',
  automatic_payment_methods: {
    enabled: true,
  },
});

// Return clientSecret to client
return { clientSecret: paymentIntent.client_secret };
```

## Elements Provider Setup

The Elements provider requires different configurations based on the stage of checkout:

```javascript
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST);

// For Address Collection
<Elements 
  stripe={stripePromise} 
  options={{
    mode: 'payment',
    amount: cart.total * 100, // Required when collecting address before PaymentIntent
    currency: 'usd'
  }}
>
  <AddressElement />
</Elements>

// For Payment Processing (after PaymentIntent creation)
<Elements 
  stripe={stripePromise} 
  options={{
    clientSecret, // From PaymentIntent
    mode: 'payment',
    appearance: {
      theme: 'stripe'
    }
  }}
>
  <PaymentElement />
</Elements>
```

## Address Element

The Address Element must be wrapped in an Elements provider. It can be used to collect shipping or billing addresses.

```javascript
import { AddressElement } from '@stripe/react-stripe-js';

<AddressElement 
  options={{
    mode: 'shipping', // or 'billing'
    allowedCountries: ['US', 'CA'],
    fields: {
      phone: 'always'
    },
    validation: {
      phone: {
        required: 'always'
      }
    }
  }}
  onChange={(event) => {
    const { complete, value } = event;
    if (complete) {
      // Address data is complete
      const addressData = {
        address1: value.address.line1,
        address2: value.address.line2,
        city: value.address.city,
        state: value.address.state,
        postcode: value.address.postal_code,
        country: value.address.country,
        name: value.name,
        phone: value.phone
      };
    }
  }}
/>
```

## Payment Element

The Payment Element provides a complete payment form that adapts to your customer's location and is optimized for mobile.

```javascript
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: '${window.location.origin}/checkout/success',
      },
    });

    if (error) {
      // Handle error
    }
    // Payment processing will redirect to return_url on success
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  );
}
```

## Payment Flow

1. **Collect Address**:
   - Display AddressElement in shipping mode
   - Collect and validate address data
   - Create payment intent with address data

2. **Process Payment**:
   - Use clientSecret from payment intent
   - Display PaymentElement
   - Confirm payment and handle redirect

## Important Notes

1. **Elements Provider Requirements**:
   - Must have either `clientSecret` or `mode` in options
   - Valid modes are: 'payment', 'setup', 'subscription'
   - Cannot use 'shipping' as mode in Elements provider (only in AddressElement options)

2. **Address Element**:
   - Must be wrapped in Elements provider
   - Can be used independently of PaymentElement
   - Supports both shipping and billing modes
   - Can prefill address data

3. **Payment Element**:
   - Requires clientSecret from payment intent
   - Automatically handles card validation
   - Supports various payment methods based on country

4. **Error Handling**:
   - Always check for stripe and elements before operations
   - Handle both validation and processing errors
   - Provide clear feedback to users

## References

- [React Stripe.js Reference](https://docs.stripe.com/sdks/stripejs-react)
- [Address Element Documentation](https://docs.stripe.com/elements/address-element)
- [Payment Element Documentation](https://docs.stripe.com/payments/payment-element)
- [Elements Provider Options](https://docs.stripe.com/js/elements_object/create)