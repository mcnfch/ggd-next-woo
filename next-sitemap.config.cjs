const { resolve } = require('path');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://groovygallerydesigns.com',
  generateIndexSitemap: true,
  sitemapSize: 5000,
  autoLastmod: true,
  exclude: [
    '/admin/*',
    '/api/*',
    '/debug/*'
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://groovygallerydesigns.com/sitemap.xml',
      'https://groovygallerydesigns.com/sitemap-products.xml',
      'https://groovygallerydesigns.com/sitemap-categories.xml',
      'https://groovygallerydesigns.com/sitemap-blog.xml',
      'https://groovygallerydesigns.com/sitemap-pages.xml'
    ],
  },
  // Only generate sitemap in production build
  outDir: process.env.NODE_ENV === 'production' ? 'public' : '.next/static'
};
