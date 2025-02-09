import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { CheckoutForm } from './CheckoutForm';

interface PaymentElementProps {
  clientSecret: string;
  amount: number;
  currency?: string;
}

export function PaymentElement({
  clientSecret,
  amount,
  currency = 'usd'
}: PaymentElementProps) {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    getStripe().then(setStripe);
  }, []);

  if (!stripe) {
    return <div>Loading payment system...</div>;
  }

  return (
    <Elements
      stripe={stripe}
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
      <CheckoutForm />
    </Elements>
  );
}
