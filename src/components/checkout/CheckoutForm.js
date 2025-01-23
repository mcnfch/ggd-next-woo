'use client';

import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/hooks/useCart';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { cart, clearCart } = useCart();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    first_name: '',
    last_name: '',
    address_1: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    email: ''
  });

  useEffect(() => {
    if (!cart?.items?.length) {
      console.log('No items in cart, skipping checkout initialization');
      return;
    }

    console.log('Initializing checkout with cart:', cart.items);
    
    // Clear any previous error messages
    setMessage(null);
    setClientSecret('');
    
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: cart.items,
        shipping_address: shippingAddress
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        console.log('Checkout API response:', { status: res.status, data });
        if (!res.ok) {
          throw new Error(data.error || 'An error occurred during checkout');
        }
        return data;
      })
      .then((data) => {
        console.log('Setting client secret:', data.clientSecret ? 'Received' : 'Missing');
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        console.error('Checkout initialization error:', err);
        setMessage(err.message || 'Failed to initialize checkout');
      });
  }, [cart?.items]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not initialized:', { stripe: !!stripe, elements: !!elements });
      setMessage('Payment system is not ready. Please refresh the page and try again.');
      return;
    }

    if (!clientSecret) {
      console.error('Missing client secret');
      setMessage('Payment session not initialized. Please try again.');
      return;
    }

    // Validate shipping address
    const missingFields = Object.entries(shippingAddress)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      console.error('Missing shipping fields:', missingFields);
      setMessage(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      console.log('Starting payment submission...');
      
      // Submit the form first
      console.log('Submitting payment form...');
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Form submission error:', submitError);
        throw submitError;
      }

      // Confirm the payment
      console.log('Confirming payment...');
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
              email: shippingAddress.email,
              address: {
                line1: shippingAddress.address_1,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.postcode,
                country: shippingAddress.country,
              }
            }
          }
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        console.error('Payment confirmation error:', {
          type: confirmError.type,
          message: confirmError.message,
          code: confirmError.code,
          decline_code: confirmError.decline_code,
          payment_method: confirmError.payment_method
        });

        if (confirmError.type === 'card_error' || confirmError.type === 'validation_error') {
          throw confirmError;
        } else {
          throw new Error(`Payment failed: ${confirmError.message}`);
        }
      }

      // If we get here, payment was successful
      console.log('Payment successful, creating WooCommerce order...');
      
      // Create WooCommerce order
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipping: shippingAddress,
          items: cart.items,
          paymentIntentId: paymentIntent.id
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      // Clear cart and redirect to success page
      await clearCart();
      window.location.href = '/checkout/success';
      
    } catch (err) {
      console.error('Payment error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        type: err.type,
        code: err.code
      });
      
      let errorMessage = 'Payment failed: ';
      if (err.type === 'card_error') {
        errorMessage += err.message;
      } else if (err.type === 'validation_error') {
        errorMessage += 'Please check your card details.';
      } else {
        errorMessage += 'An unexpected error occurred. Please try again or contact support.';
      }
      
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name"
            value={shippingAddress.first_name}
            onChange={(e) => setShippingAddress(prev => ({ ...prev, first_name: e.target.value }))}
            className="w-full p-2 border rounded text-gray-900"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={shippingAddress.last_name}
            onChange={(e) => setShippingAddress(prev => ({ ...prev, last_name: e.target.value }))}
            className="w-full p-2 border rounded text-gray-900"
            required
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={shippingAddress.email}
          onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
          className="w-full p-2 border rounded text-gray-900"
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Shipping Address</h3>
        <input
          type="text"
          placeholder="Street Address"
          value={shippingAddress.address_1}
          onChange={(e) => setShippingAddress(prev => ({ ...prev, address_1: e.target.value }))}
          className="w-full p-2 border rounded text-gray-900"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="City"
            value={shippingAddress.city}
            onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
            className="w-full p-2 border rounded text-gray-900"
            required
          />
          <input
            type="text"
            placeholder="State"
            value={shippingAddress.state}
            onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
            className="w-full p-2 border rounded text-gray-900"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Postal Code"
            value={shippingAddress.postcode}
            onChange={(e) => setShippingAddress(prev => ({ ...prev, postcode: e.target.value }))}
            className="w-full p-2 border rounded text-gray-900"
            required
          />
          <input
            type="text"
            placeholder="Country"
            value={shippingAddress.country}
            onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
            className="w-full p-2 border rounded text-gray-900"
            required
          />
        </div>
      </div>

      {clientSecret && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
          <PaymentElement />
        </div>
      )}

      {message && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !stripe || !elements || !clientSecret}
        className="w-full bg-black text-white p-4 rounded-md font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
