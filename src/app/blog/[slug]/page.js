import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getBlogPost(slug) {
    if (!slug) {
        return null;
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wp/v2/posts?slug=${slug}&_embed`,
            { 
                next: { revalidate: 3600 },
                headers: {
                    'Accept': 'application/json',
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch blog post');
        }
        
        const posts = await response.json();
        if (!posts || posts.length === 0) {
            return null;
        }
        return posts[0];
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return null;
    }
}

export default async function BlogPost(props) {
    const params = await Promise.resolve(props.params);
    const slug = params?.slug;

    if (!slug) {
        notFound();
    }

    const post = await getBlogPost(slug);
    
    if (!post) {
        notFound();
    }

    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
    const imageUrl = featuredMedia?.source_url || null;
    const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <article className="bg-white py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back to Blog Link */}
                <Link 
                    href="/blog"
                    className="inline-flex items-center text-sm text-black hover:text-gray-700 mb-8"
                >
                    <svg 
                        className="mr-2 h-5 w-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                        />
                    </svg>
                    Back to Blog
                </Link>

                {/* Article Header */}
                <header className="mb-8">
                    <h1 
                        className="text-4xl font-bold text-black mb-4"
                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />
                    <time className="text-black">{date}</time>
                </header>

                {/* Featured Image */}
                {imageUrl && (
                    <div className="relative aspect-[16/9] mb-8 rounded-lg overflow-hidden">
                        <Image
                            src={imageUrl}
                            alt={featuredMedia?.alt_text || post.title.rendered}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                {/* Article Content */}
                <div 
                    className="prose prose-lg max-w-none text-black"
                    dangerouslySetInnerHTML={{ __html: post.content.rendered }}
                />
            </div>
        </article>
    );
}

// Generate static params for static site generation
export async function generateStaticParams() {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wp/v2/posts?per_page=100`
        );
        const posts = await response.json();
        
        return posts.map((post) => ({
            slug: post.slug,
        }));
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
    }
}
