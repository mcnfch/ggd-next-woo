'use client';

import Image from 'next/image';
import { useCart } from '@/hooks/useCart';

const CartItem = ({ item }) => {
  const { removeItem, updateQuantity } = useCart();

  const handleQuantityChange = (delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(item.key, newQuantity);
    } else if (newQuantity === 0) {
      removeItem(item.key);
    }
  };

  // Get the image URL from the item's image data
  const imageUrl = item?.images?.[0]?.src || null;

  return (
    <li className="flex py-6">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name || 'Product image'}
            width={96}
            height={96}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-black">
            <h3>{item.name}</h3>
            <p className="ml-4">${parseFloat(item.price).toFixed(2)}</p>
          </div>
          {/* Display selected options/variations */}
          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {Object.entries(item.selectedOptions)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </p>
          )}
          {/* Display variations as fallback */}
          {!item.selectedOptions && item.variation && Object.keys(item.variation).length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {Object.entries(item.variation)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </p>
          )}
        </div>
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="px-2 py-1 text-black hover:text-gray-700 border border-gray-300 rounded"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="text-black">Qty {item.quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="px-2 py-1 text-black hover:text-gray-700 border border-gray-300 rounded"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <div className="flex">
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              className="font-medium text-black hover:text-gray-700"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

export default CartItem;
