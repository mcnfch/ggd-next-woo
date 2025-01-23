import Image from "next/image";
import { getTopLevelCategories } from "../lib/woocommerce";

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const categories = await getTopLevelCategories();
  console.log('Categories on homepage:', JSON.stringify(categories, null, 2));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="flex justify-center bg-gradient-to-r from-[#FF6EC7] via-[#6A82FB] to-[#FFD200]">
        <Image
          src="/images/winter25.png"
          alt="Winter Sale 25% Off"
          width={350}
          height={200}
          priority
        />
      </section>

      {/* Featured Categories */}
      <section className="py-4 md:py-16 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-4 md:mb-12">
            <h2 className="text-xl font-bold text-black backdrop-blur-md bg-white/75 py-1 rounded-lg px-4">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div key={category.id} className="relative bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 relative h-[300px]">
                  {category.image && (
                    <Image
                      src={category.image.src}
                      alt={category.name}
                      width={category.image.width}
                      height={category.image.height}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90">
                  <h3 className="text-lg font-semibold text-black">{category.name}</h3>
                  <a href={`/category/${category.slug}`} className="text-black font-semibold hover:text-purple-700">
                    Shop {category.name} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl mb-8">
            Subscribe to get updates on new arrivals and special offers
          </p>
          <form className="max-w-md mx-auto flex gap-4 mb-12">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-full text-gray-900"
            />
            <button
              type="submit"
              className="bg-purple-600 px-8 py-2 rounded-full hover:bg-purple-700 transition-colors"
            >
              Subscribe
            </button>
          </form>
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
