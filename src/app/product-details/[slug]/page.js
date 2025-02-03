import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProductDetailsClient from '@/components/ProductDetailsClient';
import { getProductBySlug } from '../../../../prod-details.mjs';
import Link from 'next/link';

export const metadata = {
  title: 'Product Details',
  description: 'View product details and options',
};

const ProductDetailsPage = async (props) => {
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) {
    return (
      <main className="min-h-screen py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Invalid Product URL</h1>
          <p className="text-xl text-white mb-8">
            The product URL appears to be invalid. Please check the URL and try again.
          </p>
          <Link 
            href="https://dev.groovygallerydesigns.com/" 
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            Return to Shop
          </Link>
        </div>
      </main>
    );
  }

  const productData = await getProductBySlug(slug);
  
  if (!productData?.product) {
    return (
      <main className="min-h-screen py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Product Not Available</h1>
          <p className="text-xl text-white mb-4">
            We couldn't find the product you're looking for.
          </p>
          <p className="text-gray-300 mb-8">
            It may have been removed or the URL might be incorrect.
          </p>
          <div className="space-y-4">
            <Link 
              href="https://dev.groovygallerydesigns.com/" 
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
            >
              Browse Our Shop
            </Link>
            <p className="text-gray-400">
              Need help? Contact our support team
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 bg-black">
      <div className="max-w-4xl mx-auto px-4">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <ProductDetailsClient productData={productData} />
        </Suspense>
      </div>
    </main>
  );
};

export default ProductDetailsPage;