import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProductDetailsClient from '@/components/ProductDetailsClient';
import { getProductBySlug } from '../../../../prod-details.mjs';

export const metadata = {
  title: 'Product Details',
  description: 'View product details and options',
};

const ProductDetailsPage = async (props) => {
  const params = await props.params;
  const slug = params?.slug;

  if (!slug) {
    notFound();
  }

  const productData = await getProductBySlug(slug);
  
  if (!productData?.product) {
    notFound();
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