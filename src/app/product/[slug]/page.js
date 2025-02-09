import { Redis } from 'ioredis';
import { Suspense } from 'react';
import ProductDetails from '@/components/product/ProductDetails';
import { api } from '@/lib/woocommerce'; // Assuming api is defined in this file

export const generateMetadata = async ({ params }) => {
  const resolvedParams = await params;
  const { product } = await getProduct(resolvedParams.slug);
  return {
    title: product ? `${product.name} - Groovy Gallery Designs` : 'Product Page',
    description: product ? product.description.replace(/<[^>]*>/g, '') : 'Product details page'
  };
};

async function getProduct(slug) {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  });

  try {
    // Get all product keys
    const keys = await redis.keys('product:*');
    
    // Search through products to find the one with matching slug
    for (const key of keys) {
      const productData = await redis.get(key);
      if (productData) {
        const product = JSON.parse(productData);
        if (product.slug === slug) {
          // Get related products
          const relatedResponse = await api.get(`products/${product.id}/related`, {
            per_page: 4
          });
          const relatedProducts = relatedResponse.data;
          
          await redis.quit();
          return { product, relatedProducts };
        }
      }
    }
    
    await redis.quit();
    return { product: null, relatedProducts: [] };
  } catch (error) {
    console.error('Error fetching product:', error);
    await redis.quit();
    return { product: null, relatedProducts: [] };
  }
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const { product, relatedProducts } = await getProduct(resolvedParams.slug);

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Product not found</div>;
  }

  return (
    <Suspense fallback={<div>Loading product details...</div>}>
      <ProductDetails product={product} relatedProducts={relatedProducts} />
    </Suspense>
  );
}
