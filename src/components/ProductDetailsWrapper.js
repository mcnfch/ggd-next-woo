'use client';

import { useState } from 'react';
import ProductGallery from './ProductGallery';
import ProductDetailsClient from './ProductDetailsClient';

export default function ProductDetailsWrapper({ product, attributes, type, galleryImages }) {
  const [variantImage, setVariantImage] = useState(null);

  const handleVariantSelect = (variant) => {
    if (variant && variant.image_url) {
      setVariantImage(variant.image_url);
    } else {
      setVariantImage(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <ProductGallery images={galleryImages} variantImage={variantImage} />
      </div>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">{product.name}</h1>
        <div className="prose prose-invert">
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        </div>
        <ProductDetailsClient 
          product={product} 
          attributes={attributes} 
          type={type}
          onVariantSelect={handleVariantSelect}
        />
      </div>
    </div>
  );
}
