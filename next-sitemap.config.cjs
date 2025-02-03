const { resolve } = require('path');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Use FRONTEND_DOMAIN for the site URL
  siteUrl: 'https://woo.groovygallerydesigns.com',
  generateRobotsTxt: true,
  exclude: [
    '/server-sitemap.xml', // Exclude server-side generated sitemap
    '/admin/*',
    '/api/*',
    '/debug/*'
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      // Add dynamic sitemap for products
      'https://woo.groovygallerydesigns.com/sitemap.xml',
    ],
  },
  // Only generate sitemap in production build
  outDir: process.env.NODE_ENV === 'production' ? 'public' : '.next/static',
}
