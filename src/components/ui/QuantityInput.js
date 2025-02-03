'use client';

import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function QuantityInput({ quantity, onQuantityChange, min = 1, max }) {
  const handleIncrement = () => {
    if (!max || quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= min && (!max || value <= max)) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="inline-flex items-center bg-gray-800 rounded-lg">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className={`p-2 ${
          quantity <= min ? 'text-gray-500' : 'text-white hover:text-purple-400'
        }`}
        aria-label="Decrease quantity"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="w-12 text-center bg-transparent text-white border-none focus:outline-none focus:ring-0"
      />
      
      <button
        type="button"
        onClick={handleIncrement}
        disabled={max && quantity >= max}
        className={`p-2 ${
          max && quantity >= max ? 'text-gray-500' : 'text-white hover:text-purple-400'
        }`}
        aria-label="Increase quantity"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
