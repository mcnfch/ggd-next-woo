import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const WOOCOMMERCE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;

const WooCommerce = WooCommerceRestApi.default;
const api = new WooCommerce({
  url: WOOCOMMERCE_URL,
  consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
  version: "wc/v3",
});

const desiredCategories = [
  "new-arrivals",
  "accessories",
  "women",
  "men",
  "groovy-gear",
  "custom-designs"
];

export async function getTopLevelCategories() {
  try {
    const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/wc/v3/products/categories?per_page=100&hide_empty=false`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRIVATE_WP_JWT_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('Raw WooCommerce categories:', data);

    // Filter and sort categories according to our desired order
    const categories = desiredCategories
      .map(slug => data.find(cat => cat.slug === slug))
      .filter(Boolean);

    console.log('Filtered categories with images:', categories.map(cat => ({
      slug: cat.slug,
      hasImage: !!cat.image,
      imageUrl: cat.image?.src
    })));

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image ? {
        src: category.image.src,
        alt: category.image.alt || category.name,
        width: 1280, // Default width from WooCommerce images
        height: 1280 // Default height from WooCommerce images
      } : null,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Cart-related functions using Store API through Next.js API routes
const storeApi = {
  async fetchWithError(method, action = null, data = null) {
    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      };

      if (data) {
        options.body = JSON.stringify({ action, ...data });
      }

      const response = await fetch('/api/cart', options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getCart() {
    return this.fetchWithError('GET');
  },

  async addToCart(productId, quantity = 1, variation = {}) {
    return this.fetchWithError('POST', 'add-item', {
      id: productId,
      quantity,
      variation,
    });
  },

  async updateCartItem(key, quantity) {
    return this.fetchWithError('POST', 'update-item', {
      key,
      quantity,
    });
  },

  async removeCartItem(key) {
    return this.fetchWithError('POST', 'remove-item', {
      key,
    });
  },
};

export { api, storeApi };