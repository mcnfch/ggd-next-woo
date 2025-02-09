import { getCategoryProducts } from '@/lib/db';
import Image from 'next/image';
import ProductCardSimple from '@/components/ProductCardSimple';

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300;

export async function generateMetadata(props) {
  // Await params in metadata generation
  const params = await props.params;
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

export default async function CategoryPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const pathString = resolvedParams.path.join('/');
  const { products, category } = await getCategoryProducts(pathString);

  const categoryName = category?.name || formatCategoryTitle(resolvedParams.path[resolvedParams.path.length - 1]);
  const description = `Collection of ${categoryName.toLowerCase()} from Groovy Gallery Designs`;

  // Create schema markup for collection
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": categoryName,
    "description": description,
    "url": `/product-category/${resolvedParams.path.join('/')}`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": categoryName,
          "item": `/product-category/${resolvedParams.path.join('/')}`
        }
      ]
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products?.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.post_title,
          "description": product.post_content
            ?.replace(/<[^>]*>/g, '') // Remove HTML tags
            ?.replace(/&amp;/g, '&')  // Convert &amp; to &
            ?.replace(/&lt;/g, '<')   // Convert &lt; to <
            ?.replace(/&gt;/g, '>')   // Convert &gt; to >
            ?.replace(/&quot;/g, '"') // Convert &quot; to "
            ?.replace(/&#039;/g, "'") // Convert &#039; to '
            ?.trim() || '',
          "image": product.thumbnail_url,
          "url": `/product-details/${product.post_name}`,
          "brand": {
            "@type": "Brand",
            "name": "Groovy Gallery Designs"
          }
        }
      }))
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div className="text-center mb-12">
        <Image
          src="/images/category-header.jpg"
          alt="Category Header"
          width={1200}
          height={400}
          className="w-full h-[400px] object-cover rounded-lg mb-8"
          priority
        />

        <h1 className="text-3xl font-bold text-white mb-8">
          {categoryName}
        </h1>

        {products?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCardSimple
                key={product.ID}
                product={{
                  id: product.ID,
                  name: product.post_title,
                  slug: product.post_name,
                  price: product.regular_price,
                  image: product.thumbnail_url,
                  category: categoryName
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-lg">No products found in this category.</p>
        )}
      </div>
    </div>
  );
}
