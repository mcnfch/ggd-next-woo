'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import ImageGallery from './ImageGallery';
import RelatedProducts from './RelatedProducts';
import Link from 'next/link';
import QuantityInput from './ui/QuantityInput';
import { useCart } from '@/hooks/useCart';
import { toast } from 'react-hot-toast';

export default function ProductDetailsClient({ productData }) {
  if (!productData || !productData.product) {
    return <div className="text-white">Loading product data...</div>;
  }

  const { product, variations = [], available_attributes = {}, related_products = [] } = productData;
  const { addItem } = useCart();
  
  // State
  const [selectedOptions, setSelectedOptions] = useState({});
  const [currentVariation, setCurrentVariation] = useState(null);
  const [displayedImage, setDisplayedImage] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Process available attributes - exclude shipping and single-option variants from display
  const processedAttributes = useMemo(() => {
    const attrs = {};
    if (variations && variations.length > 0) {
      variations.forEach(variant => {
        if (variant.attributes) {
          Object.entries(variant.attributes).forEach(([key, value]) => {
            // Skip shipping and other excluded attributes
            if (key.toLowerCase().includes('shipping') || 
                key.toLowerCase().includes('ships') ||
                key.toLowerCase().includes('ship-') ||
                key.toLowerCase().includes('delivery')) {
              return;
            }
            
            const cleanKey = key.replace(/^pa_/, '');
            if (!attrs[cleanKey]) {
              attrs[cleanKey] = new Set();
            }
            attrs[cleanKey].add(value);
          });
        }
      });
    }
    
    // Filter out attributes with only one option for display
    return Object.fromEntries(
      Object.entries(attrs)
        .filter(([_, values]) => values.size > 1)
        .map(([key, values]) => [key, Array.from(values)])
    );
  }, [variations]);

  // Get all unique attributes including single-option ones
  const allAttributes = useMemo(() => {
    const attrs = {};
    variations.forEach(variant => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!key.toLowerCase().includes('shipping') && 
              !key.toLowerCase().includes('ships') &&
              !key.toLowerCase().includes('ship-') &&
              !key.toLowerCase().includes('delivery')) {
            if (!attrs[key]) {
              attrs[key] = new Set();
            }
            attrs[key].add(value);
          }
        });
      }
    });
    return attrs;
  }, [variations]);

  // Validation function
  const validateSelection = () => {
    const errors = {};
    Object.keys(processedAttributes).forEach(attr => {
      const key = `pa_${attr}`;
      if (!selectedOptions[key]) {
        errors[key] = `Please select a ${attr.replace(/-/g, ' ')}`;
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!validateSelection()) {
      toast.error('Please select all required options');
      return;
    }

    // Debug: Check current variation data
    console.log('Current variation:', currentVariation);
    console.log('Product main image:', product.main_image);

    setIsAddingToCart(true);
    try {
      const itemToAdd = {
        id: currentVariation?.id || product.id,
        name: product.name || product.title,
        price: currentVariation?.price || product.price,
        images: currentVariation?.image 
          ? [{ src: currentVariation.image }] 
          : product.main_image 
            ? [{ src: product.main_image }]
            : [],
        quantity,
        selectedOptions: Object.entries(selectedOptions).reduce((acc, [key, value]) => {
          acc[key.replace('pa_', '')] = value;
          return acc;
        }, {})
      };

      // Debug: Check item being added to cart
      console.log('Adding item to cart:', itemToAdd);

      await addItem(itemToAdd);
      toast.success('Added to cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    // Auto-select single-option variants
    const initialOptions = {};
    Object.entries(allAttributes).forEach(([key, values]) => {
      if (values.size === 1) {
        initialOptions[key] = Array.from(values)[0];
      }
    });
    setSelectedOptions(prev => ({
      ...prev,
      ...initialOptions
    }));
  }, [allAttributes]);

  // Find which attribute controls images (usually 'color' or similar)
  const imageAttribute = useMemo(() => {
    const possibleImageAttrs = ['pa_color', 'pa_style'];
    return possibleImageAttrs.find(attr => 
      variations.some(v => v.attributes[attr] && v.image)
    );
  }, [variations]);

  // Get variant by single attribute
  const findVariantByAttribute = (attributeName, value) => {
    return variations.find(variant => 
      variant.attributes[attributeName] === value
    );
  };

  // Handle attribute selection
  const handleOptionChange = (name, value) => {
    const newOptions = {
      ...selectedOptions,
      [name]: value
    };
    setSelectedOptions(newOptions);

    // If this is the image-controlling attribute, update image immediately
    if (name === imageAttribute) {
      const imageVariant = findVariantByAttribute(name, value);
      if (imageVariant?.image) {
        setDisplayedImage(imageVariant.image);
        // Find and auto-select any single-option variants for this color
        const matchingVariant = variations.find(v => v.attributes[name] === value);
        if (matchingVariant) {
          Object.entries(matchingVariant.attributes).forEach(([attrName, attrValue]) => {
            if (allAttributes[attrName]?.size === 1) {
              newOptions[attrName] = attrValue;
            }
          });
          setSelectedOptions(newOptions);
        }
      }
    }

    // Update current variation
    const matchingVariation = variations.find(variant => {
      return Object.entries(variant.attributes).every(
        ([attr, val]) => !newOptions[attr] || variant.attributes[attr] === newOptions[attr]
      );
    });

    if (matchingVariation) {
      setCurrentVariation(matchingVariation);
    }
  };

  // Handle image click from gallery
  const handleImageClick = (image) => {
    setDisplayedImage(image);
  };

  // Check if all required options are selected (only for attributes with multiple options)
  const allOptionsSelected = Object.keys(processedAttributes).every(
    attr => selectedOptions[`pa_${attr}`] && selectedOptions[`pa_${attr}`] !== ''
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Main product section - always two columns */}
      <div className="grid grid-cols-[1fr,1fr] gap-8">
        {/* Left Column - Image Gallery */}
        <div>
          <ImageGallery 
            mainImage={product.main_image}
            variantImage={displayedImage || currentVariation?.image}
            images={product.gallery_images}
            title={product.title}
            onImageClick={handleImageClick}
          />
        </div>

        {/* Right Column - Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{product.title}</h1>
            <p className="text-3xl font-bold text-white">${currentVariation?.price || product.price}</p>
          </div>

          {/* Size/Variant Selectors */}
          <div className="space-y-4">
            {Object.entries(processedAttributes).map(([attrName, values]) => (
              <div key={attrName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-white capitalize">{attrName.replace(/-/g, ' ')}</label>
                </div>
                <div className="relative">
                  <select
                    value={selectedOptions[`pa_${attrName}`] || ''}
                    onChange={(e) => handleOptionChange(`pa_${attrName}`, e.target.value)}
                    className={`w-full bg-gray-800 text-white py-2 pl-4 pr-10 rounded-lg appearance-none cursor-pointer ${
                      validationErrors[`pa_${attrName}`] ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select {attrName.replace(/-/g, ' ')}</option>
                    {values.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white pointer-events-none" />
                  {validationErrors[`pa_${attrName}`] && (
                    <p className="text-red-500 text-sm">{validationErrors[`pa_${attrName}`]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <div>
              <label className="block text-white mb-2">Quantity</label>
              <QuantityInput
                quantity={quantity}
                onQuantityChange={setQuantity}
                min={1}
                max={currentVariation?.max_qty || product.max_qty}
              />
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all
              ${!isAddingToCart ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-800'}
            `}
          >
            {isAddingToCart ? 'Adding...' : 'Add to cart'}
          </button>
        </div>
      </div>

      {/* Detailed Description - Accordion */}
      <div className="mt-12">
        <button
          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          className="w-full flex items-center justify-between text-white py-4 border-t border-b border-gray-700"
        >
          <h2 className="text-xl font-bold">Detailed description</h2>
          <ChevronDownIcon 
            className={`h-6 w-6 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`}
          />
        </button>
        {isDescriptionExpanded && (
          <div className="py-6 text-white">
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        )}
      </div>

      {/* Related Products */}
      {related_products?.length > 0 && (
        <div className="mt-12">
          <RelatedProducts products={{ related: { nodes: related_products }}} />
        </div>
      )}
    </div>
  );
}
