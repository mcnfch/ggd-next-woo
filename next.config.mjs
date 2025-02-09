/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['woo.groovygallerydesigns.com'],
  },
  output: 'standalone',
  poweredByHeader: false,
  generateEtags: true,
  distDir: '.next',
  cleanDistDir: true,
};

export default nextConfig;
