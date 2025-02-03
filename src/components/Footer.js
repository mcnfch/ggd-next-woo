import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchFooterMenu } from '@/utils/api';
import BlogCarousel from '@/components/BlogCarousel';
import { FaFacebook, FaInstagram, FaTiktok, FaPinterest } from 'react-icons/fa';

export default async function Footer() {
    const footerLinks = [
        {
            title: 'Company',
            links: [
                {
                    name: 'About Us',
                    href: '/about-us',
                    key: 'about'
                },
                {
                    name: 'Shipping',
                    href: '/shipping',
                    key: 'shipping'
                },
                {
                    name: 'Our Sustainability Practices',
                    href: '/our-sustainability-practices',
                    key: 'sustainability'
                },
                {
                    name: 'Refunds and Returns',
                    href: '/refunds-and-returns',
                    key: 'returns'
                }
            ]
        }
    ];

    return (
        <footer className="bg-black text-white">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Logo and Description */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <Link href="/" className="block mb-4">
                            <Image
                                src="/images/GGLogo2.0.png"
                                alt="Groovy Gallery Designs"
                                width={200}
                                height={50}
                                className="w-auto h-auto"
                            />
                        </Link>
                        <p className="text-gray-300 mb-6">
                            Explore Groovy Gallery Designs for unique, festival-inspired fashion, bold rave gear, and vibrant campsite essentials. Perfect for self-expression, our psychedelic clothing, retro accessories, and trippy home decor bring the spirit of festivals into your everyday life
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://www.facebook.com/profile.php?id=100093237820590" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                                <FaFacebook size={24} />
                            </a>
                            <a href="https://www.instagram.com/groovygallerydesigns/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                                <FaInstagram size={24} />
                            </a>
                            <a href="https://www.tiktok.com/@groovygallerydesigns" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                                <FaTiktok size={24} />
                            </a>
                            <a href="https://www.pinterest.com/GroovyGalleryDesigns" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                                <FaPinterest size={24} />
                            </a>
                        </div>
                    </div>

                    {/* Footer Links */}
                    {footerLinks.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.key}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-300 hover:text-white transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Blog Section */}
                    <div>
                        <Link href="https://dev.groovygallerydesigns.com/blog" className="hover:text-white transition-colors">
                            <h3 className="text-lg font-semibold mb-4">Latest Blog Posts</h3>
                        </Link>
                        <BlogCarousel />
                    </div>

                    {/* Copyright */}
                    <div className="border-t border-gray-800 mt-16 pt-8 text-center">
                        <p className="text-gray-400">
                            {new Date().getFullYear()} Groovy Gallery Designs. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
