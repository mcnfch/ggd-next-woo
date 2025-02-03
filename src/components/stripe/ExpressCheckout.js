import { useEffect, useState } from 'react';
import { ExpressCheckoutElement } from '@stripe/react-stripe-js';

interface ExpressCheckoutProps {
  onConfirm?: () => void;
}

export function ExpressCheckout({ onConfirm }: ExpressCheckoutProps) {
  return (
    <ExpressCheckoutElement
      onConfirm={onConfirm}
      options={{
        buttonType: {
          applePay: 'buy',
          googlePay: 'buy',
        },
      }}
    />
  );
}
