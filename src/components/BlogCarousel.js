'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const WP_API_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;

export default function BlogCarousel() {
    const [posts, setPosts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${WP_API_URL}/wp-json/wp/v2/posts?_embed&per_page=5`, {
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                if (!response.ok) throw new Error('Failed to fetch posts');
                const data = await response.json();
                setPosts(data);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
                setError('Failed to load blog posts');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
    }, [posts.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length);
    }, [posts.length]);

    // Auto-advance slides every 5 seconds
    useEffect(() => {
        if (posts.length <= 1) return;
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide, posts.length]);

    if (loading) {
        return (
            <div className="w-full h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-700"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-48 flex items-center justify-center text-black">
                {error}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="w-full h-48 flex items-center justify-center text-black">
                No blog posts found
            </div>
        );
    }

    return (
        <div className="w-full relative bg-white rounded-lg shadow-lg overflow-hidden min-h-[325px]">
            <div className="relative px-16 py-8">
                {posts.map((post, index) => (
                    <div
                        key={post.id}
                        className={`transition-all duration-500 ${
                            index === currentIndex ? 'opacity-100 translate-x-0' : 'opacity-0 absolute inset-0'
                        }`}
                        style={{ 
                            transform: index === currentIndex ? 'none' : 'translateX(100%)',
                            visibility: index === currentIndex ? 'visible' : 'hidden'
                        }}
                    >
                        <Link href={`/blog/${post.slug}`} className="block">
                            <h3 className="text-xl font-semibold text-black hover:text-purple-700 mb-4">
                                {post.title.rendered}
                            </h3>
                        </Link>
                        <div 
                            className="text-black mb-6 line-clamp-3 prose-sm"
                            dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                        />
                        <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center text-purple-700 font-semibold hover:text-purple-900"
                        >
                            Read more
                            <span className="ml-2" aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                ))}
            </div>

            {/* Navigation dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {posts.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 w-2 rounded-full transition-all ${
                            index === currentIndex ? 'bg-purple-700 w-4' : 'bg-gray-300'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Navigation arrows */}
            {posts.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/60 hover:bg-white/90 p-1.5 rounded-full shadow-sm focus:outline-none transition-colors"
                        aria-label="Previous slide"
                    >
                        <ChevronLeftIcon className="h-4 w-4 text-gray-800" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/60 hover:bg-white/90 p-1.5 rounded-full shadow-sm focus:outline-none transition-colors"
                        aria-label="Next slide"
                    >
                        <ChevronRightIcon className="h-4 w-4 text-gray-800" />
                    </button>
                </>
            )}
        </div>
    );
}
