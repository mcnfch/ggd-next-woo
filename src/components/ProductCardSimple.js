'use client';

import Image from 'next/image';
import Link from 'next/link';

const shimmer = (w, h) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export default function ProductCardSimple({ product }) {
  if (!product) return null;
  
  const { name, images = [], permalink, slug } = product;
  const mainImage = images?.[0];
  
  if (!mainImage) {
    return null;
  }

  const imageWidth = 800;
  const imageHeight = 800;
  
  // Use environment variables for domain
  const frontendDomain = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
  const devPermalink = frontendDomain + '/product-details/' + slug;

  const getProperImageUrl = (url) => {
    if (!url) return '';
    
    // Handle AliExpress URLs that got mixed with wp-content path
    if (url.includes('wp-content/uploads/https://')) {
      return url.split('wp-content/uploads/')[1];
    }
    
    // If it's already a full URL (but not mixed with wp-content), return it
    if (url.startsWith('http')) {
      return url;
    }
    
    // For WordPress media URLs, ensure proper path construction
    return `${process.env.PUBLIC_HTTP_ENDPOINT}/wp-content/uploads/${url}`;
  };

  return (
    <Link 
      href={`/product-details/${slug}`} 
      className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-full flex flex-col"
      aria-label={`View ${name}`}
    >
      <div className="relative w-full pt-[100%]">
        {mainImage && (
          <Image
            src={getProperImageUrl(mainImage.src)}
            alt={mainImage.alt || name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="absolute inset-0 w-full h-full object-cover"
            priority={false}
            quality={75}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
          />
        )}
      </div>
      <div className="p-2 sm:p-4 flex flex-col flex-grow">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">{name}</h3>
      </div>
    </Link>
  );
}
