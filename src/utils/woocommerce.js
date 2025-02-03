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
