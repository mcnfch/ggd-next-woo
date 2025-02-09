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

export default function ProductCard({ product }) {
  const { name, images, price, regular_price, sale_price, slug } = product;
  const mainImage = images[0];
  
  if (!mainImage) {
    return null; // Don't render cards without images
  }

  // Calculate optimal image dimensions
  const imageWidth = 800;
  const imageHeight = 800;

  // Use environment variables for domain
  const frontendDomain = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
  const permalink = frontendDomain + '/product-details/' + product.slug;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Link href={permalink} className="block relative aspect-square">
        <Image
          src={mainImage.src}
          alt={mainImage.alt || name}
          width={imageWidth}
          height={imageHeight}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          priority={false}
          quality={75}
          placeholder="blur"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(imageWidth, imageHeight))}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
      </Link>
      
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2 line-clamp-2">
          <Link href={permalink} className="hover:text-blue-600 text-black">
            {name}
          </Link>
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
          <span className="text-black" style={{marginRight: '-7px'}}>$</span>
            <span className="text-black font-bold">{price}</span>
          </div>
          
          <button 
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            onClick={() => {
              // Add to cart functionality will be implemented later
              console.log('Add to cart:', product.id);
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
