import xml2js from 'xml2js';
import { fetchAllProducts, fetchAllCategories, fetchAllPosts } from './woocommerce.js';

const SITE_URL = `https://${process.env.PUBLIC_DOMAIN}` || 'https://groovygallerydesigns.com';

export async function generateSitemapIndex() {
  const sitemaps = [
    'sitemap-products.xml',
    'sitemap-categories.xml',
    'sitemap-blog.xml',
    'sitemap-pages.xml'
  ];

  const index = {
    sitemapindex: {
      $: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
      sitemap: sitemaps.map(sitemap => ({
        loc: [`${SITE_URL}/${sitemap}`]
      }))
    }
  };

  const builder = new xml2js.Builder();
  return builder.buildObject(index);
}

export async function generateProductsSitemap() {
  try {
    const products = await fetchAllProducts();
    if (!products || !Array.isArray(products)) {
      console.warn('No products found or invalid products data');
      return generateEmptySitemap();
    }

    const urls = products.map(product => {
      if (!product?.slug) {
        console.warn('Invalid product data:', product);
        return null;
      }
      return {
        loc: [`${SITE_URL}/product-details/${product.slug}`],
        lastmod: [new Date(product.modified || new Date()).toISOString()],
        changefreq: ['daily'],
        priority: ['0.8']
      };
    }).filter(Boolean);

    return generateSitemap(urls);
  } catch (error) {
    console.error('Error generating products sitemap:', error);
    return generateEmptySitemap();
  }
}

export async function generateCategoriesSitemap() {
  try {
    const categories = await fetchAllCategories();
    if (!categories || !Array.isArray(categories)) {
      console.warn('No categories found or invalid categories data');
      return generateEmptySitemap();
    }

    const urls = categories.map(category => {
      if (!category?.slug) {
        console.warn('Invalid category data:', category);
        return null;
      }
      return {
        loc: [`${SITE_URL}/product-category/${category.slug}`],
        lastmod: [new Date().toISOString()],
        changefreq: ['weekly'],
        priority: ['0.7']
      };
    }).filter(Boolean);

    return generateSitemap(urls);
  } catch (error) {
    console.error('Error generating categories sitemap:', error);
    return generateEmptySitemap();
  }
}

export async function generateBlogSitemap() {
  try {
    const posts = await fetchAllPosts();
    if (!posts || !Array.isArray(posts)) {
      console.warn('No posts found or invalid posts data');
      return generateEmptySitemap();
    }

    const urls = posts.map(post => {
      if (!post?.slug) {
        console.warn('Invalid post data:', post);
        return null;
      }
      return {
        loc: [`${SITE_URL}/blog/${post.slug}`],
        lastmod: [new Date(post.modified || new Date()).toISOString()],
        changefreq: ['weekly'],
        priority: ['0.6']
      };
    }).filter(Boolean);

    return generateSitemap(urls);
  } catch (error) {
    console.error('Error generating blog sitemap:', error);
    return generateEmptySitemap();
  }
}

export async function generatePagesSitemap() {
  const staticPages = [
    { loc: `${SITE_URL}/about-us`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/shipping`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/refunds-and-returns`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/our-sustainability-practices`, priority: '0.5', changefreq: 'monthly' }
  ];

  const urls = staticPages.map(page => ({
    loc: [page.loc],
    lastmod: [new Date().toISOString()],
    changefreq: [page.changefreq],
    priority: [page.priority]
  }));
  
  const sitemap = {
    urlset: {
      $: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
      url: urls
    }
  };

  const builder = new xml2js.Builder();
  return builder.buildObject(sitemap);
}

// Helper function to generate empty sitemap
function generateEmptySitemap() {
  const sitemap = {
    urlset: {
      $: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
      url: []
    }
  };
  const builder = new xml2js.Builder();
  return builder.buildObject(sitemap);
}

// Helper function to generate sitemap from URLs
function generateSitemap(urls) {
  const sitemap = {
    urlset: {
      $: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
      url: urls
    }
  };
  const builder = new xml2js.Builder();
  return builder.buildObject(sitemap);
}
