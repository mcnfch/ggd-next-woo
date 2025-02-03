'use client';

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

  const imageUrl = Array.isArray(item.images) && item.images[0]?.src 
    ? item.images[0].src 
    : Array.isArray(item.images) && item.images.length > 0 
      ? item.images[0] 
      : typeof item.images === 'string' 
        ? item.images 
        : '';

  return (
    <div className="flex py-6">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-border">
        <img
          src={imageUrl}
          alt={item.name}
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-primary">
            <h3>{item.name}</h3>
            <p className="ml-4">${parseFloat(item.price).toFixed(2)}</p>
          </div>
          {item.variation && Object.keys(item.variation).length > 0 && (
            <p className="mt-1 text-sm text-primary">
              {Object.entries(item.variation)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </p>
          )}
        </div>
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="px-2 py-1 text-primary hover:opacity-75"
            >
              -
            </button>
            <p className="text-primary mx-2">Qty {item.quantity}</p>
            <button
              onClick={() => handleQuantityChange(1)}
              className="px-2 py-1 text-primary hover:opacity-75"
            >
              +
            </button>
          </div>
          <div className="flex">
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              className="font-medium text-primary hover:opacity-75"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
