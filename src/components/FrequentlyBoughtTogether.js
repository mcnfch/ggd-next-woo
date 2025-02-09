'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function FrequentlyBoughtTogether({ productId }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/v3/products/${productId}?_fields=id,related_ids`,
          {
            headers: {
              Authorization: `Basic ${btoa(
                `${process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET}`
              )}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch product data');
        }

        const product = await response.json();
        
        if (!product.related_ids?.length) {
          setLoading(false);
          return;
        }

        const relatedResponse = await fetch(
          `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/v3/products?include=${product.related_ids.join(',')}&_fields=id,name,price,images,permalink`,
          {
            headers: {
              Authorization: `Basic ${btoa(
                `${process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET}`
              )}`,
            },
          }
        );

        if (!relatedResponse.ok) {
          throw new Error('Failed to fetch related products');
        }

        const relatedProductsData = await relatedResponse.json();
        setRelatedProducts(relatedProductsData.slice(0, 5)); // Show up to 5 products
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchRelatedProducts();
    }
  }, [productId]);

  if (loading || error || !relatedProducts.length) {
    return null;
  }

  return (
    <div className="mt-8 bg-black p-6">
      <h2 className="text-xl font-semibold mb-6 text-white">Often Bought Together</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {relatedProducts.map((product) => (
          <a key={product.id} href={product.permalink} className="block bg-white rounded-lg p-4">
            <div className="relative aspect-square mb-4">
              <Image
                src={product.images[0]?.src || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover rounded"
              />
            </div>
            
            <h3 className="text-black text-sm font-medium line-clamp-2 mb-2">
              {product.name}
            </h3>
            
            <p className="text-black font-semibold">
              ${parseFloat(product.price).toFixed(2)}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
