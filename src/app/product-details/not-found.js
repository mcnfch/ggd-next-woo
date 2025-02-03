import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <main className="min-h-screen py-16 bg-black">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Product Not Found</h1>
        <p className="text-xl text-white mb-8">
          We couldn't find the product you're looking for. It may have been removed or the URL might be incorrect.
        </p>
        <Link 
          href="/shop" 
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
        >
          Return to Shop
        </Link>
      </div>
    </main>
  );
}
