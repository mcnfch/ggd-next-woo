const MAX_URLS_PER_SITEMAP = 45000; // Keeping below 50k limit for safety

export function splitSitemap(urls, type) {
  const sitemaps = [];
  
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_SITEMAP);
    const index = Math.floor(i / MAX_URLS_PER_SITEMAP);
    sitemaps.push({
      name: index === 0 ? `sitemap-${type}` : `sitemap-${type}-${index}`,
      urls: chunk
    });
  }
  
  return sitemaps;
}
