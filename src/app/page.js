import Image from "next/image";
import { getTopLevelCategories } from "../lib/woocommerce";
import NewsletterForm from "@/components/NewsletterForm";

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const categories = await getTopLevelCategories();

  // Create schema markup for homepage categories
  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Product",
          "name": "New Festival Fashion Arrivals",
          "description": "Latest festival fashion and accessories",
          "url": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/product-category/new-arrivals`,
          "brand": {
            "@type": "Brand",
            "name": "Groovy Gallery Designs"
          },
          "category": "Festival Fashion",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "19.99",
            "highPrice": "199.99",
            "availability": "https://schema.org/InStock"
          },
          "image": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/images/new-arrivals-collection.jpg`
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Product",
          "name": "Festival Accessories Collection",
          "description": "Complete your festival look with our accessories collection",
          "url": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/product-category/accessories`,
          "brand": {
            "@type": "Brand",
            "name": "Groovy Gallery Designs"
          },
          "category": "Festival Accessories",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "9.99",
            "highPrice": "99.99",
            "availability": "https://schema.org/InStock"
          },
          "image": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/images/accessories-collection.jpg`
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Product",
          "name": "Women's Festival Fashion Collection",
          "description": "Festival fashion for women",
          "url": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/product-category/womens`,
          "brand": {
            "@type": "Brand",
            "name": "Groovy Gallery Designs"
          },
          "category": "Women's Fashion",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "24.99",
            "highPrice": "199.99",
            "availability": "https://schema.org/InStock"
          },
          "image": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/images/womens-collection.jpg`
        }
      },
      {
        "@type": "ListItem",
        "position": 4,
        "item": {
          "@type": "Product",
          "name": "Men's Festival Fashion Collection",
          "description": "Festival fashion for men",
          "url": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/product-category/mens`,
          "brand": {
            "@type": "Brand",
            "name": "Groovy Gallery Designs"
          },
          "category": "Men's Fashion",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "24.99",
            "highPrice": "199.99",
            "availability": "https://schema.org/InStock"
          },
          "image": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/images/mens-collection.jpg`
        }
      },
      {
        "@type": "ListItem",
        "position": 5,
        "item": {
          "@type": "Product",
          "name": "Festival Comfort Essentials Collection",
          "description": "Essential comfort items for festival-goers",
          "url": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/product-category/essentials`,
          "brand": {
            "@type": "Brand",
            "name": "Groovy Gallery Designs"
          },
          "category": "Festival Essentials",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "14.99",
            "highPrice": "79.99",
            "availability": "https://schema.org/InStock"
          },
          "image": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/images/essentials-collection.jpg`
        }
      },
      {
        "@type": "ListItem",
        "position": 6,
        "item": {
          "@type": "Product",
          "name": "Custom Festival Designs Service",
          "description": "Create your own unique festival fashion pieces",
          "url": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/custom-designs`,
          "brand": {
            "@type": "Brand",
            "name": "Groovy Gallery Designs"
          },
          "category": "Custom Designs",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "49.99",
            "highPrice": "299.99",
            "availability": "https://schema.org/InStock"
          },
          "image": `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/images/custom-designs.jpg`
        }
      }
    ]
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeSchema)
        }}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#FF6EC7] via-[#6A82FB] to-[#FFD200] flex justify-center">
        <Image
          src="/images/winter25.png"
          alt="Winter 25 Sale"
          width={350}
          height={200}
          priority
          className="!w-[350px] !h-[200px]"
        />
      </section>

      {/* Featured Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl mb-8">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => {
              // Special handling for Custom Designs
              const isCustomDesigns = category.slug === 'custom-designs';
              const href = isCustomDesigns ? "/custom-designs" : `/product-category/${category.slug}`;
              const description = isCustomDesigns 
                ? "Create your own unique piece with our custom design service"
                : category.description || `Explore our ${category.name} collection`;
              const buttonText = isCustomDesigns ? "Start Creating" : "Shop Now";
              
              return (
                <a 
                  key={category.id} 
                  href={href}
                  className="block bg-white rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="aspect-w-16 aspect-h-9 relative h-[300px]">
                    {category.image ? (
                      <Image
                        src={category.image.src}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                        <span className="text-4xl text-purple-500">✨</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-white">
                    <h3 className="text-xl font-semibold mb-2 text-black">{category.name}</h3>
                    <p className="text-black mb-4">{description}</p>
                    <span className="inline-flex items-center text-purple-600 hover:text-purple-800">
                      {buttonText}
                      <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <NewsletterForm />
          <div className="mt-8">
            <Image
              src="/images/badges.png"
              alt="Trust Badges"
              width={800}
              height={100}
              className="mx-auto"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
