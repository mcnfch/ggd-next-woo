'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCart } from '@/hooks/useCart';
import { logger } from '@/lib/logger';

export default function CheckoutForm({ clientSecret, billingInfo, shippingInfo }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Please provide payment details.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, clientSecret]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: `${billingInfo.firstName} ${billingInfo.lastName}`,
              email: billingInfo.email,
              address: {
                line1: billingInfo.address1,
                line2: billingInfo.address2 || '',
                city: billingInfo.city,
                state: billingInfo.state,
                postal_code: billingInfo.postcode,
                country: billingInfo.country,
              },
              phone: billingInfo.phone || '',
            },
          },
          shipping: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            address: {
              line1: shippingInfo.address1,
              line2: shippingInfo.address2 || '',
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.postcode,
              country: shippingInfo.country,
            },
            phone: shippingInfo.phone || '',
          },
        },
      });

      if (stripeError) {
        logger.error('Payment confirmation failed', stripeError);
        setMessage(stripeError.message);
        return;
      }

      // 2. Create the order if payment succeeded
      if (paymentIntent.status === "succeeded") {
        try {
          const orderResponse = await fetch('/api/orders/create-with-generator', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              shipping: shippingInfo,
              items: cart.items,
              paymentIntent: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency
              }
            }),
          });

          if (!orderResponse.ok) {
            const errorData = await orderResponse.text();
            throw new Error(`Order creation failed: ${errorData}`);
          }

          const order = await orderResponse.json();
          
          // Clear the cart and redirect
          await clearCart();
          logger.info('Payment and order successful', { 
            paymentIntentId: paymentIntent.id,
            orderId: order.id,
            amount: paymentIntent.amount,
            email: billingInfo.email
          });
          
          setMessage("Order successful!");
          router.push('/');
        } catch (err) {
          logger.error('Order creation failed', {
            error: err,
            paymentIntent: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount
            }
          });
          setMessage("Payment successful but order creation failed. Our team will contact you.");
        }
      } else {
        setMessage("Payment not completed. Please try again.");
      }
    } catch (err) {
      logger.error('Checkout process failed', err);
      setMessage("An error occurred during checkout. Please try again.");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {message && (
        <div className="mt-4 text-sm text-gray-600">
          {message}
        </div>
      )}
      
      <button
        disabled={isProcessing || !stripe || !elements}
        className={`w-full py-3 px-4 text-white rounded-md ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
