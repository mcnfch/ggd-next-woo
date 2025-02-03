'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { getStripe } from '@/lib/stripe';
import { useCart } from '@/hooks/useCart';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, getStripeTotalAmount } = useCart();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    postcode: '',
    country: 'US'
  });
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    postcode: '',
    country: 'US'
  });

  useEffect(() => {
    if (sameAsShipping) {
      setShippingInfo(billingInfo);
    }
  }, [sameAsShipping, billingInfo]);

  useEffect(() => {
    if (!loading && cart?.items?.length > 0) {
      createPaymentIntent();
    }
  }, [cart, loading]);

  const createPaymentIntent = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getStripeTotalAmount(),
          metadata: {
            cartId: cart.id,
            existingPaymentIntentId: paymentIntentId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      setError(error.message || 'Error creating payment intent');
      console.error('Error creating payment intent:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!cart?.items?.length) {
    return <div className="min-h-screen flex items-center justify-center text-white">Your cart is empty</div>;
  }

  const stripePromise = getStripe();
  if (!stripePromise) {
    return <div className="min-h-screen flex items-center justify-center text-white">Unable to load payment system</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Cart Summary */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Order Summary</h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 text-white">
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-700 rounded">
                  {item.images?.[0]?.src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0].src}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-gray-400">Quantity: {item.quantity}</p>
                </div>
                <p className="text-lg">${formatPrice(item.price)}</p>
              </div>
            ))}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex justify-between text-white">
                <span>Total</span>
                <span className="text-xl font-bold">${formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Steps */}
        <div className="space-y-4">
          {/* Billing Section */}
          <div className="bg-gray-800 rounded-lg">
            <button
              className="flex justify-between w-full px-6 py-4 text-left text-white"
              onClick={() => setCurrentStep(currentStep === 'billing' ? null : 'billing')}
            >
              <span className="text-lg font-medium">1. Billing Information</span>
              <ChevronUpIcon 
                className={`${currentStep === 'billing' ? 'transform rotate-180' : ''} w-5 h-5`}
              />
            </button>
            <div className={`${currentStep === 'billing' ? 'block' : 'hidden'} px-6 pb-6`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={billingInfo.firstName}
                    onChange={handleBillingChange}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={billingInfo.lastName}
                    onChange={handleBillingChange}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white">Address</label>
                  <input
                    type="text"
                    name="address1"
                    value={billingInfo.address1}
                    onChange={handleBillingChange}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white">City</label>
                  <input
                    type="text"
                    name="city"
                    value={billingInfo.city}
                    onChange={handleBillingChange}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white">State</label>
                  <input
                    type="text"
                    name="state"
                    value={billingInfo.state}
                    onChange={handleBillingChange}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white">Postal Code</label>
                  <input
                    type="text"
                    name="postcode"
                    value={billingInfo.postcode}
                    onChange={handleBillingChange}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={billingInfo.country}
                    onChange={handleBillingChange}
                    className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Section */}
          <div className="bg-gray-800 rounded-lg">
            <button
              className="flex justify-between w-full px-6 py-4 text-left text-white"
              onClick={() => setCurrentStep(currentStep === 'shipping' ? null : 'shipping')}
            >
              <span className="text-lg font-medium">2. Shipping Information</span>
              <ChevronUpIcon 
                className={`${currentStep === 'shipping' ? 'transform rotate-180' : ''} w-5 h-5`}
              />
            </button>
            <div className={`${currentStep === 'shipping' ? 'block' : 'hidden'} px-6 pb-6`}>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-white">Same as billing address</span>
                </label>
              </div>

              {!sameAsShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={shippingInfo.firstName}
                      onChange={handleShippingChange}
                      className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={shippingInfo.lastName}
                      onChange={handleShippingChange}
                      className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white">Address</label>
                    <input
                      type="text"
                      name="address1"
                      value={shippingInfo.address1}
                      onChange={handleShippingChange}
                      className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingChange}
                      className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">State</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleShippingChange}
                      className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">Postal Code</label>
                    <input
                      type="text"
                      name="postcode"
                      value={shippingInfo.postcode}
                      onChange={handleShippingChange}
                      className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={shippingInfo.country}
                      onChange={handleShippingChange}
                      className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-gray-800 rounded-lg">
            <button
              className="flex justify-between w-full px-6 py-4 text-left text-white"
              onClick={() => setCurrentStep(currentStep === 'payment' ? null : 'payment')}
              disabled={!clientSecret}
            >
              <span className="text-lg font-medium">3. Payment Information</span>
              <ChevronUpIcon 
                className={`${currentStep === 'payment' ? 'transform rotate-180' : ''} w-5 h-5`}
              />
            </button>
            <div className={`${currentStep === 'payment' ? 'block' : 'hidden'} px-6 pb-6`}>
              {error && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {!clientSecret ? (
                <button
                  onClick={createPaymentIntent}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-600"
                >
                  {isProcessing ? 'Processing...' : 'Continue to Payment'}
                </button>
              ) : (
                <Elements 
                  stripe={stripePromise} 
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#7c3aed',
                        colorBackground: '#1f2937',
                        colorText: '#ffffff',
                        colorDanger: '#dc2626',
                        fontFamily: 'Inter var, sans-serif',
                      },
                    },
                  }}
                >
                  <CheckoutForm 
                    clientSecret={clientSecret}
                    billingInfo={billingInfo}
                    shippingInfo={shippingInfo}
                  />
                </Elements>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
