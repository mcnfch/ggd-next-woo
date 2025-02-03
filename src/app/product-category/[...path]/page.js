import Image from 'next/image';
import ProductCardSimple from '@/components/ProductCardSimple';
import { getCategoryProducts } from '@/lib/db';

// Cache for 5 minutes
export const revalidate = 300;

export async function generateMetadata(props) {
  // Await params in metadata generation
  const params = await Promise.resolve(props.params);
  const lastSlug = params.path[params.path.length - 1];
  
  const title = lastSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${title} - Groovy Gallery Designs`,
    description: `Discover our collection of ${title.toLowerCase()} at Groovy Gallery Designs`,
    // Add OpenGraph metadata for better social sharing
    openGraph: {
      title: `${title} - Groovy Gallery Designs`,
      description: `Discover our collection of ${title.toLowerCase()} at Groovy Gallery Designs`,
      type: 'website'
    }
  };
}

function formatCategoryTitle(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function ProductCategoryPage({ params }) {
  // Ensure params is resolved
  const resolvedParams = await Promise.resolve(params);
  const pathString = resolvedParams.path.join('/');
  
  const { products, category } = await getCategoryProducts(pathString);

  // Create schema markup for collection
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category?.name || 'Products',
    "description": `Collection of ${category?.name?.toLowerCase() || 'products'} from Groovy Gallery Designs`,
    "url": `${process.env.PUBLIC_DOMAIN || ''}/product-category/${resolvedParams.path.join('/')}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products?.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "description": product.description?.replace(/<[^>]*>/g, '') // Remove HTML tags
            ?.replace(/&amp;/g, '&')  // Convert &amp; to &
            ?.replace(/&lt;/g, '<')   // Convert &lt; to <
            ?.replace(/&gt;/g, '>')   // Convert &gt; to >
            ?.replace(/&quot;/g, '"') // Convert &quot; to "
            ?.replace(/&#039;/g, "'") // Convert &#039; to '
            ?.trim() || '',
          "image": product.images?.[0] ? `${process.env.PUBLIC_HTTP_ENDPOINT}/wp-content/uploads/${product.images[0].src}` : '',
          "url": `${process.env.PUBLIC_DOMAIN || ''}/product-details/${product.slug}`,
          "brand": {
            "@type": "Brand",
            "name": "Groovy Gallery Designs"
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "price": product.price || "0.00",
            "availability": product.stock_status === 'instock'
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock"
          }
        }
      }))
    }
  };

  return (
    <div className="bg-black min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(collectionSchema)
          }}
        />

        <h1 className="text-3xl font-bold text-white mb-8">
          {category?.name || formatCategoryTitle(resolvedParams.path[resolvedParams.path.length - 1])}
        </h1>

        {products?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCardSimple
                key={product.id}
                product={{
                  ...product,
                  images: product.images?.map(img => ({
                    ...img,
                    src: `${process.env.PUBLIC_HTTP_ENDPOINT}/wp-content/uploads/${img.src}`
                  }))
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-300">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
