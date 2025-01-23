'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

export default function SuccessPage() {
  const { cart, clearCart } = useCart();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createOrder = async () => {
      try {
        const paymentIntentId = searchParams.get('payment_intent');
        if (!paymentIntentId) {
          throw new Error('No payment intent ID found');
        }

        // Create WooCommerce order
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cart.items,
            paymentIntentId,
            shipping: cart.shipping || {}
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create order');
        }

        // Clear cart only after successful order creation
        clearCart();
      } catch (err) {
        console.error('Error creating order:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (cart?.items?.length) {
      createOrder();
    } else {
      setIsLoading(false);
    }
  }, [cart, clearCart, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-4">
            Processing your order...
          </h2>
          <p className="text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-lg text-red-600 mb-8">
              {error}
            </p>
            <p className="text-gray-600 mb-8">
              Don't worry, your payment was successful. Our team has been notified and will process your order manually.
            </p>
            <Link
              href="/"
              className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-4">
            Thank you for your order!
          </h1>
          <p className="text-lg text-gray-900 mb-8">
            Your payment was successful and your order is being processed.
          </p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
