'use client';

import Image from 'next/image';
import Link from 'next/link';

const shimmer = (w, h) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="20%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export default function ProductCardSimple({ product }) {
  const { name, images, price, permalink, slug } = product;
  const mainImage = images[0];
  
  if (!mainImage) {
    return null;
  }

  const imageWidth = 800;
  const imageHeight = 800;
  
  // Use environment variables for domain
  const frontendDomain = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
  const devPermalink = frontendDomain + '/product/' + slug;
  
  return (
    <Link 
      href={devPermalink} 
      className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-full flex flex-col"
      aria-label={`View ${name}`}
    >
      <div className="relative aspect-[1/1.2] sm:aspect-square">
        <Image
          src={mainImage.src}
          alt={mainImage.alt || `Product image of ${name}`}
          width={imageWidth}
          height={imageHeight}
          className="object-cover w-full h-full"
          priority={false}
          quality={75}
          placeholder="blur"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(imageWidth, imageHeight))}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
        />
      </div>
      <div className="p-2 sm:p-4 flex flex-col flex-grow">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">{name}</h3>
        <div className="mt-1 sm:mt-auto">
          <p className="text-base sm:text-lg font-bold text-gray-900" aria-label={`Price: $${parseFloat(price).toFixed(2)}`}>
            ${parseFloat(price).toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  );
}
