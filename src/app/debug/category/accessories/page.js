import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/woocommerce';

export const metadata = {
  title: 'Accessories - Groovy Gallery Designs',
  description: 'Browse our collection of accessories'
};

async function getProducts() {
  try {
    const response = await api.get('products', {
      category: 'accessories',
      per_page: 20
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function AccessoriesPage() {
  const products = await getProducts();

  // Structured data for Google
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Festival & Rave Accessories",
    "description": "Discover our collection of festival and rave accessories",
    "url": "https://woo.groovygallerydesigns.com/debug/category/accessories",
    "numberOfItems": products.length,
    "itemListElement": products.map((product, index) => ({
      "@type": "Product",
      "position": index + 1,
      "name": product.name,
      "description": product.description.replace(/<[^>]*>/g, ''), // Strip HTML
      "image": product.images[0]?.src || '',
      "url": product.permalink,
      "sku": product.sku,
      "brand": {
        "@type": "Brand",
        "name": "Groovy Gallery Designs"
      },
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "USD",
        "availability": product.stock_status === 'instock' 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock"
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <h1 className="text-3xl font-bold mb-8">Festival & Rave Accessories</h1>
      <p className="text-gray-600 mb-8">
        {products.length} products found in accessories category
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
