'use client';

import ProductGallery from '@/components/ProductGallery';
import CartControls from '@/components/cart/CartControls';
import ProductCard from '@/components/ProductCard';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export default function ProductDetails({ product, relatedProducts }) {
  // Use environment variables for domain
  const frontendDomain = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
  const productUrl = `${frontendDomain}/product-details/${product.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')  // Convert &amp; to &
      .replace(/&lt;/g, '<')   // Convert &lt; to <
      .replace(/&gt;/g, '>')   // Convert &gt; to >
      .replace(/&quot;/g, '"') // Convert &quot; to "
      .replace(/&#039;/g, "'") // Convert &#039; to '
      .trim(),
    "image": product.images.map(img => img.src),
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": "Groovy Gallery Designs"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "USD",
      "price": product.price || "0.00",
      "availability": product.stock_status === 'instock'
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
    }
  };

  // Create a separate schema for related products
  const relatedProductsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Often Bought Together",
    "itemListElement": relatedProducts?.map((relatedProduct, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": relatedProduct.name,
        "url": `${frontendDomain}/product-details/${relatedProduct.slug}`,
        "image": relatedProduct.images[0]?.src,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": relatedProduct.price || "0.00",
          "availability": relatedProduct.stock_status === 'instock'
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock"
        }
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      {relatedProducts?.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(relatedProductsSchema)
          }}
        />
      )}

      {/* Mobile Title */}
      <div className="md:hidden mb-6">
        <h2 className="text-2xl font-bold text-white">{product.name.replace(/['"]/g, '')}</h2>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-2 gap-8 mb-16">
        {/* Product Gallery */}
        <div className="order-1">
          <ProductGallery images={product.images} />
        </div>

        {/* Product Info */}
        <div className="order-2 bg-white p-8 rounded-lg shadow-sm">
          {/* Desktop Title */}
          <div className="hidden md:block">
            <h2 className="text-3xl font-bold text-black mb-4">{product.name.replace(/['"]/g, '')}</h2>
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-2xl font-bold text-black">
              ${parseFloat(product.price).toFixed(2)}
            </p>
            {product.regular_price && (
              <p className="text-gray-500 line-through">
                ${parseFloat(product.regular_price).toFixed(2)}
              </p>
            )}
          </div>

          {/* Description */}
          <div 
            className="prose prose-sm max-w-none mb-8 text-primary"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

          {/* Add to Cart */}
          <CartControls product={product} />
        </div>
      </div>

      {/* Often Bought Together Section */}
      {relatedProducts?.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-white">Often Bought Together</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 max-w-7xl mx-auto">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Link href={`/product-details/${relatedProduct.slug}`} className="block">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                    <Image
                      src={relatedProduct.images[0]?.src || '/placeholder.png'}
                      alt={relatedProduct.name}
                      width={500}
                      height={500}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-black mb-2 line-clamp-2">{relatedProduct.name}</h3>
                    <p className="text-lg font-medium text-black">{formatPrice(relatedProduct.price)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
