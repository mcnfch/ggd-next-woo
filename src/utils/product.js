export function generateStructuredData(product) {
  const categories = product.categories?.split(',').map(cat => {
    const [id, slug, name] = cat.split(':');
    return { id, slug, name };
  }) || [];

  const metaData = product.meta_data?.split(',').reduce((acc, item) => {
    const [key, value] = item.split(':');
    acc[key] = value;
    return acc;
  }, {}) || {};

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.thumbnail_url ? [product.thumbnail_url] : [],
    sku: product.sku,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Groovy Gallery Designs',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.PUBLIC_DOMAIN}/product-details/${product.slug}`,
      priceCurrency: 'USD',
      price: metaData._price || '',
      availability: metaData._stock_status === 'instock' 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    }
  };
}
