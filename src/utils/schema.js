export function generateProductSchema(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.replace(/<[^>]*>/g, '') || '',
    image: product.images?.[0]?.src || '',
    sku: product.sku || '',
    mpn: product.id?.toString() || '',
    brand: {
      '@type': 'Brand',
      name: 'Groovy Gallery Designs'
    },
    offers: {
      '@type': 'Offer',
      url: `https://groovygallerydesigns.com/product-details/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      availability: product.stock_status === 'instock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Groovy Gallery Designs'
      }
    }
  };
}

export function generateProductCardSchema(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image?.sourceUrl || '',
    offers: {
      '@type': 'Offer',
      url: `https://groovygallerydesigns.com/product-details/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price || '0.00',
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Groovy Gallery Designs'
      }
    }
  };
}
