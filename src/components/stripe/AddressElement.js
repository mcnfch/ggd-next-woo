import { useEffect, useState } from 'react';
import { AddressElement as StripeAddressElement } from '@stripe/react-stripe-js';

interface AddressElementProps {
  onChange?: (address: any) => void;
}

export function AddressElement({ onChange }: AddressElementProps) {
  return (
    <StripeAddressElement
      options={{
        mode: 'shipping',
        allowedCountries: ['US', 'CA'],
        fields: {
          phone: 'required',
        },
        validation: {
          phone: {
            required: 'error',
          },
        },
      }}
      onChange={(event) => {
        if (event.complete && onChange) {
          onChange(event.value);
        }
      }}
    />
  );
}
