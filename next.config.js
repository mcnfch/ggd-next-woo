/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'woo.groovygallerydesigns.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'ae01.alicdn.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3010', 'woo.groovygallerydesigns.com'],
    },
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap.xml'
      },
      {
        source: '/sitemap-products.xml',
        destination: '/api/sitemap-products.xml'
      },
      {
        source: '/sitemap-categories.xml',
        destination: '/api/sitemap-categories.xml'
      },
      {
        source: '/sitemap-blog.xml',
        destination: '/api/sitemap-blog.xml'
      },
      {
        source: '/sitemap-pages.xml',
        destination: '/api/sitemap-pages.xml'
      }
    ];
  }
};

export default nextConfig;
