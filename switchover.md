# Product System Switchover Plan

## Areas Requiring Updates

### 1. Navigation Links
Files that need URL path updates:
- `/src/components/product/ProductDetails.js` - Related products links
- `/src/components/RelatedProducts.js` - Product links
- `/src/components/ProductDetailsClient.js` - Product links
- `/src/components/FrequentlyBoughtTogether.js` - Product permalinks
- `/src/app/page.js` - Category navigation

### 2. API Routes
- `/src/app/api/product/[id]/variation/route.js` - Product variation API
- Need to ensure it works with our new MySQL-based system

### 3. Data Fetching
- Moving to direct MySQL queries from WooCommerce database
- No additional caching layer needed (using WooCommerce's built-in caching)

### 4. Components to Update
- `ProductDetailsClient.js` - Main product display
- `RelatedProducts.js` - Related products section
- `FrequentlyBoughtTogether.js` - Product recommendations

### 5. Category System
- Current implementation: `/app/category/[...path]`
- New implementation: `/app/product-category/[...path]`
- Need to update all category links to use new paths

### 6. Post-Switchover Tasks
- Test and adjust SEO metadata if needed
- Re-implement sitemap for new URL structure

## Migration Steps

1. Create parallel implementation in `/src-next`
2. Test new implementation thoroughly
3. Update all navigation to point to new paths
4. Monitor for any issues
5. Remove old implementation once confirmed working

## Rollback Plan

1. Keep backup of current implementation in `/rollback`
2. Maintain ability to switch back to old paths if needed
3. Keep old data fetching methods available during transition
