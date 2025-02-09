// Base WooCommerce API functions
async function wooFetch(endpoint) {
  const url = `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/v3${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET}`
        ).toString('base64')}`,
      },
    });

    if (!response.ok) {
      console.error('WooCommerce API error:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        response: await response.text()
      });
      throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
    }

    const totalItems = parseInt(response.headers.get('X-WP-Total') || '0');
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');

    const data = await response.json();
    return { data, totalItems, totalPages };
  } catch (error) {
    console.error('WooCommerce API fetch error:', {
      error: error.message,
      url: url
    });
    throw error;
  }
}

export async function fetchProducts(perPage = 100, page = 1) {
  return wooFetch(`/products?per_page=${perPage}&page=${page}&status=publish`);
}

export async function fetchAllProducts() {
  const firstPage = await fetchProducts(100, 1);
  const { totalPages } = firstPage;
  let allProducts = [...firstPage.data];

  // Fetch remaining pages in parallel
  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const pagePromises = remainingPages.map(page => fetchProducts(100, page));
    const results = await Promise.all(pagePromises);
    
    results.forEach(result => {
      allProducts = allProducts.concat(result.data);
    });
  }

  return allProducts;
}

export async function fetchCategories(perPage = 100, page = 1) {
  return wooFetch(`/products/categories?per_page=${perPage}&page=${page}`);
}

export async function fetchAllCategories() {
  const firstPage = await fetchCategories(100, 1);
  const { totalPages } = firstPage;
  let allCategories = [...firstPage.data];

  // Fetch remaining pages in parallel
  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const pagePromises = remainingPages.map(page => fetchCategories(100, page));
    const results = await Promise.all(pagePromises);
    
    results.forEach(result => {
      allCategories = allCategories.concat(result.data);
    });
  }

  return allCategories;
}

export async function fetchPosts(perPage = 100, page = 1) {
  // Using WP REST API for posts
  const url = `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&status=publish`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.statusText}`);
  }
  
  const totalItems = parseInt(response.headers.get('X-WP-Total') || '0');
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
  const data = await response.json();
  
  return { data, totalItems, totalPages };
}

export async function fetchAllPosts() {
  const firstPage = await fetchPosts(100, 1);
  const { totalPages } = firstPage;
  let allPosts = [...firstPage.data];

  // Fetch remaining pages in parallel
  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const pagePromises = remainingPages.map(page => fetchPosts(100, page));
    const results = await Promise.all(pagePromises);
    
    results.forEach(result => {
      allPosts = allPosts.concat(result.data);
    });
  }

  return allPosts;
}

export async function fetchProductVariations(productId) {
  const url = `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/v3/products/${productId}/variations`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET}`
      ).toString('base64')}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch variations: ${response.statusText}`);
  }

  return response.json();
}
