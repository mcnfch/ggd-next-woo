'use client';

import { AddressElement as StripeAddressElement } from '@stripe/react-stripe-js';

export default function AddressElement({ onChange, options }) {
  const handleAddressChange = async (event) => {
    const { complete, value } = event;
    
    // Always pass the complete status and value to parent
    onChange?.({
      complete,
      value: {
        name: value.name,
        phone: value.phone,
        address: {
          line1: value.address.line1,
          line2: value.address.line2,
          city: value.address.city,
          state: value.address.state,
          postal_code: value.address.postal_code,
          country: value.address.country,
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <StripeAddressElement 
        options={options}
        onChange={handleAddressChange}
      />
    </div>
  );
}
