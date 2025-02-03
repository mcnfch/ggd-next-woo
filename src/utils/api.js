import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const WooCommerce = WooCommerceRestApi.default;
const api = new WooCommerce({
  url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
  consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
  version: "wc/v3"
});

export const fetchMenu = async (menuId) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/menus/v1/menus/${menuId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      console.error('Menu fetch error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw menu data:', JSON.stringify(data, null, 2));
    return data.items || [];
  } catch (error) {
    console.error('Error fetching menu:', error);
    return [];
  }
};

export const organizeMenuItems = (items) => {
  if (!Array.isArray(items)) {
    console.error('Expected items to be an array, got:', typeof items);
    return [];
  }
  
  const decodeTitle = (title) => {
    return title.replace(/&amp;/g, '&')
                .replace(/&#038;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'");
  };
  
  // Only filter out Custom Designs from navigation menu
  return items
    .filter(item => !item.title.toLowerCase().includes('custom designs'))
    .map(item => ({
      id: item.ID,
      title: decodeTitle(item.title),
      url: transformUrl(item.url),
      children: item.child_items ? item.child_items.map(child => ({
        id: child.ID,
        title: decodeTitle(child.title),
        url: transformUrl(child.url)
      })) : []
    }));
};

// Transform URLs to use local routing
function transformUrl(url) {
  if (!url) return '#';
  
  // Handle product category URLs
  if (url.includes('/product-category/')) {
    return `/product-category/${url.split('/product-category/')[1].replace(/\/$/, '')}`;
  }
  
  // Don't transform custom designs URL
  if (url.includes('custom-designs')) {
    return url;
  }

  // Handle product URLs
  if (url.includes('/product/')) {
    return `/product-details/${url.split('/product/')[1].replace(/\/$/, '')}`;
  }
  
  // Handle woo.groovygallerydesigns.com URLs
  if (url.includes('woo.groovygallerydesigns.com')) {
    const urlObj = new URL(url);
    let path = urlObj.pathname.replace(/\/$/, '');
    
    // Transform paths from the WooCommerce site
    if (path.includes('/product/')) {
      path = path.replace('/product/', '/product-details/');
    }
    if (path.includes('/product-category/')) {
      path = path.replace('/product-category/', '/product-category/');
    }
    
    return path;
  }
  
  return url;
}

export const fetchFooterMenu = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/menus/v1/menus/437`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      console.error('Footer menu fetch error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching footer menu:', error);
    return [];
  }
};

export const fetchCategories = async () => {
  try {
    const response = await api.get("products/categories", {
      per_page: 100,
      parent: 0
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export async function fetchFooterPages() {
    const pageIds = {
        'about-us': 8380,
        'shipping': 8378,
        'our-sustainability-practices': 8376,
        'refunds-and-returns': 4203
    };

    const pages = {};
    const baseUrl = process.env.PUBLIC_HTTP_ENDPOINT;

    try {
        await Promise.all(
            Object.entries(pageIds).map(async ([key, id]) => {
                const response = await fetch(`${baseUrl}/wp-json/wp/v2/pages/${id}?context=view`, {
                    next: { revalidate: 3600 } // Cache for 1 hour
                });

                if (!response.ok) {
                    console.error(`Failed to fetch ${key} page:`, response.statusText);
                    return;
                }

                const data = await response.json();
                pages[key] = {
                    title: data.title.rendered,
                    content: data.content.rendered,
                    slug: data.slug
                };
            })
        );

        return pages;
    } catch (error) {
        console.error('Error fetching footer pages:', error);
        return {};
    }
}
