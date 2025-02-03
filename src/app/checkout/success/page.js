'use client';

import { useEffect, useState, useRef } from 'react';
import { Elements, useStripe } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe';
import { useCart } from '@/hooks/useCart';

function CheckoutSuccessContent() {
  const stripe = useStripe();
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const orderCreated = useRef(false);

  useEffect(() => {
    if (!stripe || orderCreated.current) {
      return;
    }

    // Retrieve the "payment_intent_client_secret" query parameter
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      setError('No payment information found');
      return;
    }

    async function handlePaymentSuccess(paymentIntent) {
      try {
        // Extract billing and shipping details from payment intent
        const [firstName, ...lastNameParts] = (paymentIntent.shipping?.name || '').split(' ');
        const lastName = lastNameParts.join(' ');
        const address = paymentIntent.shipping?.address || {};
        const billingDetails = paymentIntent.payment_method?.billing_details || {};

        // Create order in WooCommerce
        const orderResponse = await fetch('/api/orders/create-with-generator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipping: {
              firstName,
              lastName,
              company: '',
              address1: billingDetails.address?.line1 || address.line1,
              address2: billingDetails.address?.line2 || address.line2 || '',
              city: billingDetails.address?.city || address.city,
              state: billingDetails.address?.state || address.state,
              postcode: billingDetails.address?.postal_code || address.postal_code,
              country: billingDetails.address?.country || address.country,
            },
            items: cart.items,
            paymentIntentId: paymentIntent.id,
          }),
        });

        const order = await orderResponse.json();

        // Mark order as created to prevent duplicates
        orderCreated.current = true;
        setStatus('succeeded');
        
        // Clear the cart after successful order creation
        await clearCart();
        
        logger.info('Payment confirmed and order created', {
          paymentIntentId: paymentIntent.id,
          orderId: order.id,
          total: paymentIntent.amount,
          email: billingDetails.email
        });
      } catch (err) {
        logger.error('Error creating order:', err);
        setError('Payment successful but order creation failed. Our team will contact you.');
      }
    }

    stripe
      .retrievePaymentIntent(clientSecret)
      .then(async ({ paymentIntent }) => {
        if (!paymentIntent) {
          setError('No payment information found');
          return;
        }

        switch (paymentIntent.status) {
          case 'succeeded':
            if (!orderCreated.current) {
              await handlePaymentSuccess(paymentIntent);
            }
            break;
          case 'processing':
            setStatus('processing');
            break;
          case 'requires_payment_method':
            setError('Payment failed. Please try another payment method.');
            break;
          default:
            setError('Something went wrong.');
            break;
        }
      })
      .catch((err) => {
        logger.error('Error retrieving payment intent', err);
        setError('An error occurred while checking payment status.');
      });
  }, [stripe]); // Only depend on stripe to prevent re-runs

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/checkout')}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <div className="animate-pulse text-2xl mb-4">Processing payment...</div>
        <p className="text-gray-300">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-3xl mb-4">🎉 Thank you for your order!</div>
      <p className="text-gray-300 mb-8">Your payment has been processed successfully.</p>
      <button
        onClick={() => router.push('/')}
        className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
      >
        Continue Shopping
      </button>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Elements stripe={getStripe()}>
      <CheckoutSuccessContent />
    </Elements>
  );
}
