'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function RelatedProducts({ products }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Ensure products is an array and has items
  const relatedProducts = products?.related?.nodes || [];
  console.log('Related Products Data:', relatedProducts);
  
  if (relatedProducts.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex + 3 >= relatedProducts.length ? 0 : prevIndex + 3
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex - 3 < 0 ? Math.max(0, relatedProducts.length - 3) : prevIndex - 3
    );
  };

  const visibleProducts = relatedProducts.slice(currentIndex, currentIndex + 3);

  return (
    <div className="mt-12 mb-12 max-w-[1400px] mx-auto">
      <h2 className="text-2xl font-bold text-white px-4 mb-6">You Might Also Like</h2>
      <div className="relative px-12">
        <div className="overflow-hidden">
          <div className="flex gap-6">
            {visibleProducts.map((product) => {
              console.log('Product Image:', product.image); // Debug log
              return (
                <Link 
                  key={product.id} 
                  href={`/product-details/${product.slug}`}
                  className="w-1/3 min-w-[calc(33.333% - 1rem)] bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
                >
                  <div className="aspect-square relative w-full h-[200px]">
                    {product.image?.sourceUrl ? (
                      <Image
                        src={product.image.sourceUrl}
                        alt={product.image.altText || product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xs font-medium line-clamp-2 mb-2 text-white">
                      {product.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        {relatedProducts.length > 3 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/80 p-3 rounded-full hover:bg-black transition-colors z-10"
              aria-label="Previous products"
            >
              <ChevronLeftIcon className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/80 p-3 rounded-full hover:bg-black transition-colors z-10"
              aria-label="Next products"
            >
              <ChevronRightIcon className="h-6 w-6 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
