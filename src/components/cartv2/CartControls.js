'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

export default function CartControls({ product }) {
  const { addItem, handleCartClick } = useCart();
  const [selectedVariation, setSelectedVariation] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const handleVariationChange = (attributeName, value) => {
    setSelectedVariation(prev => ({
      ...prev,
      [attributeName]: value
    }));
    setError('');
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const isFormValid = () => {
    if (!product.attributes || product.attributes.length === 0) return true;
    return product.attributes.every(attr => 
      !attr.variation || selectedVariation[attr.name]
    );
  };

  const handleAddToCart = () => {
    if (!isFormValid()) {
      setError('Please select all options before adding to cart');
      return;
    }

    // Combine selected variations with default attributes
    const finalVariations = {
      ...product.defaultAttributes,
      ...selectedVariation
    };

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      images: product.images,
      variation: finalVariations,
      key: `${product.id}-${Object.values(finalVariations).join('-')}`
    };

    try {
      addItem(cartItem);
      handleCartClick(); // Open cart after adding item
    } catch (error) {
      setError('Failed to add item to cart');
      console.error('Add to cart error:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Only show multi-option attributes */}
      {product.attributes?.filter((attribute) => attribute.options.length > 1).map((attribute) => (
        <div key={attribute.name} className="mb-4">
          <label className="block text-sm font-bold text-primary mb-2">
            {attribute.name}
          </label>
          <select
            value={selectedVariation[attribute.name] || ''}
            onChange={(e) => handleVariationChange(attribute.name, e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base text-primary border-border focus:outline-none focus:ring-primary focus:border-primary rounded-md bg-background"
          >
            <option value="">Select {attribute.name}</option>
            {attribute.options.map((option) => (
              <option key={option} value={option} className="text-primary">
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Quantity */}
      <div className="flex items-center justify-between border border-border rounded-md p-2 bg-background">
        <button
          onClick={() => handleQuantityChange(-1)}
          className="px-3 py-1 text-primary hover:opacity-75"
        >
          -
        </button>
        <span className="text-primary font-medium">Quantity: {quantity}</span>
        <button
          onClick={() => handleQuantityChange(1)}
          className="px-3 py-1 text-primary hover:opacity-75"
        >
          +
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
      )}

      <button
        onClick={handleAddToCart}
        className="w-full py-2 px-4 bg-primary text-background rounded-full hover:opacity-75 transition-all"
      >
        Add to Cart
      </button>
    </div>
  );
}
