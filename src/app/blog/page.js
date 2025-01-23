import Image from 'next/image';
import Link from 'next/link';

async function getBlogPosts() {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wp/v2/posts?_embed`, {
            next: { revalidate: 3600 },
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch blog posts');
        }
        
        return response.json();
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return [];
    }
}

export default async function BlogPage() {
    const posts = await getBlogPosts();

    if (!posts || posts.length === 0) {
        return (
            <div className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-bold text-black mb-8">Blog</h1>
                    <p className="text-black">No blog posts found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-black mb-8">Blog</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => {
                        const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
                        const imageUrl = featuredMedia?.source_url || null;
                        
                        return (
                            <article key={post.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg">
                                {imageUrl && (
                                    <div className="flex-shrink-0">
                                        <div className="relative h-48 w-full">
                                            <Image
                                                src={imageUrl}
                                                alt={featuredMedia?.alt_text || post.title.rendered}
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col justify-between bg-white p-6">
                                    <div className="flex-1">
                                        <Link href={`/blog/${post.slug}`} className="block mt-2">
                                            <h2 
                                                className="text-xl font-semibold text-black hover:text-gray-600"
                                                dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                                            />
                                            <div 
                                                className="mt-3 text-base text-black line-clamp-3"
                                                dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                                            />
                                        </Link>
                                    </div>
                                    <div className="mt-6">
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-base font-semibold text-black hover:text-purple-700"
                                        >
                                            Read more<span aria-hidden="true"> &rarr;</span>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
