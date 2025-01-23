'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/hooks/useCart';
import CheckoutForm from '@/components/checkout/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST);

const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0066cc',
    colorBackground: '#ffffff',
    colorText: '#000000',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '4px',
  },
  rules: {
    '.Label': {
      marginBottom: '8px',
      color: '#000000'
    }
  }
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { cart, loading } = useCart();
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;

    if (!loading && (!cart?.items || cart.items.length === 0)) {
      router.push('/cart');
      return;
    }

    const createIntent = async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            items: cart.items
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Payment intent creation failed:', err);
        setError(err.message);
      }
    };

    createIntent();
  }, [cart?.items, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => router.push('/cart')}
            className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded-md hover:bg-red-200"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="order-2 md:order-1">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-black mb-6">Checkout</h2>
            {clientSecret && (
              <Elements 
                stripe={stripePromise} 
                options={{
                  clientSecret,
                  appearance,
                }}
              >
                <CheckoutForm />
              </Elements>
            )}
          </div>
        </div>
        
        <div className="order-1 md:order-2">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-black mb-4">Order Summary</h3>
            {cart?.items?.map((item) => (
              <div key={item.key} className="flex justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="font-medium text-black">{item.name}</p>
                  <p className="text-black">Quantity: {item.quantity}</p>
                  {item.variation && Object.keys(item.variation).length > 0 && (
                    <div className="mt-1">
                      {Object.entries(item.variation).map(([key, value]) => (
                        <p key={key} className="text-black">
                          {key}: {value}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <p className="font-medium text-black">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <div className="border-t mt-4 pt-4 border-gray-200">
              <div className="flex justify-between font-semibold">
                <p className="text-black">Total</p>
                <p className="text-black">${cart?.items?.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
