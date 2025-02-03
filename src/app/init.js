import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import fs from 'fs/promises';
import path from 'path';

let initializationPromise = null;

export async function initializeServer() {
  if (initializationPromise) {
    return initializationPromise;
  }

  if (typeof window !== 'undefined') {
    return { status: 'skipped', message: 'Client-side initialization not needed' };
  }

  initializationPromise = new Promise(async (resolve) => {
    const api = new WooCommerceRestApi({
      url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://woo.groovygallerydesigns.com',
      consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
      consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
      version: 'wc/v3'
    });

    const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json');

    try {
      // Ensure data directory exists
      const dataDir = path.join(process.cwd(), 'data');
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      // Get current product count
      console.log('Checking product count...');
      const countResponse = await api.get('products', { per_page: 1 });
      const currentCount = parseInt(countResponse.headers['x-wp-total'], 10);

      let products = [];
      let shouldUpdateFile = true;

      try {
        const fileContent = await fs.readFile(PRODUCTS_FILE, 'utf-8');
        const savedProducts = JSON.parse(fileContent);
        if (savedProducts.length === currentCount) {
          console.log('Product count matches saved file, using cached data');
          products = savedProducts;
          shouldUpdateFile = false;
        }
      } catch (error) {
        console.log('No valid products file found or count mismatch, fetching fresh data');
      }

      if (shouldUpdateFile) {
        console.log('Fetching all products...');
        let page = 1;
        const perPage = 100;

        while (true) {
          const response = await api.get('products', {
            per_page: perPage,
            page: page
          });

          const pageProducts = response.data;
          if (pageProducts.length === 0) break;

          products = [...products, ...pageProducts];
          console.log(`Fetched page ${page} (${pageProducts.length} products)`);
          page++;
        }

        if (products.length > 0) {
          console.log('Saving products to file...');
          await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        }
      }

      resolve({
        status: 'success',
        results: {
          total: products.length,
          usedCache: !shouldUpdateFile
        }
      });
    } catch (error) {
      console.error('Database initialization failed:', error);
      resolve({ status: 'error', message: error.message });
    }
  });

  return initializationPromise;
}
