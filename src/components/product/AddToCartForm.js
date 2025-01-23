'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

export default function AddToCartForm({ product }) {
  const { addItem } = useCart();
  const [selectedVariation, setSelectedVariation] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVariationChange = (attributeName, value) => {
    setSelectedVariation(prev => ({
      ...prev,
      [attributeName]: value
    }));
    setError(null); // Clear any previous errors
  };

  const isFormValid = () => {
    if (!product.attributes || product.attributes.length === 0) return true;
    
    return product.attributes.every(attr => 
      !attr.variation || selectedVariation[attr.name]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!product || !product.id) {
        throw new Error('Invalid product data');
      }

      // Generate a unique key for the item based on product ID and selected variations
      const variationKey = Object.entries(selectedVariation)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}-${value}`)
        .join('-');
      
      const itemKey = variationKey ? `${product.id}-${variationKey}` : `${product.id}`;

      // Ensure price is a valid number
      const price = typeof product.price === 'number' ? product.price :
                   typeof product.price === 'string' ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : 0;

      if (isNaN(price)) {
        throw new Error('Invalid product price');
      }

      const cartItem = {
        id: product.id.toString(), // Ensure ID is a string
        name: product.name,
        price: price,
        variation: selectedVariation,
        images: product.images || [],
        key: itemKey,
        quantity: 1
      };

      console.log('Adding item to cart:', cartItem);
      await addItem(cartItem);
    } catch (err) {
      console.error('Add to cart error:', err);
      setError(err.message || 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      {/* Product Options */}
      <div className="mt-6">
        {product.attributes?.map((attribute) => (
          <div key={attribute.id} className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              {attribute.name}
            </label>
            <select
              value={selectedVariation[attribute.name] || ''}
              onChange={(e) => handleVariationChange(attribute.name, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
            >
              <option value="">Select {attribute.name}</option>
              {attribute.options.map((option) => (
                <option key={`${attribute.id}-${option}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {/* Add to Cart Button */}
      <div className="mt-10 flex w-full flex-col space-y-4">
        {!isFormValid() && (
          <p className="text-red-500 text-sm mb-4">Please select all options before adding to cart</p>
        )}
        <button
          type="submit"
          disabled={!isFormValid() || loading}
          className={`w-full py-3 px-8 flex items-center justify-center rounded-md border border-transparent text-base font-medium text-white ${
            !isFormValid() || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {loading ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </form>
  );
}
