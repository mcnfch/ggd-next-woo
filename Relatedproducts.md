PRODUCT_ID=8822
curl -s -X GET \
  "https://woo.groovygallerydesigns.com/wp-json/wc/v3/products/$PRODUCT_ID" \
  -u "ck_90846993a7f31d0c512aee435ac278edd2b07a63:cs_8cccc3b94095049498243682dc77f6f5bf502e84" \
  -H "Accept: application/json" | jq '{id, name, related_ids}'

# Frequently Bought Together Component

## Overview
This component displays related products that are frequently purchased together with the current product. It uses the WooCommerce API to fetch related products based on the current product's ID.

## Implementation Details

### 1. Component Structure
```jsx
FrequentlyBoughtTogether.js
- Main container
- Product grid
- Price summary
- Add to cart button
```

### 2. API Integration
```javascript
GET /wp-json/wc/v3/products/${productId}
- Fetches current product details including related_ids

GET /wp-json/wc/v3/products?include=${relatedIds}
- Fetches related products data
```

### 3. Features
- Display up to 3 related products
- Show combined price
- Allow selecting/deselecting products
- Add all selected products to cart

### 4. Styling
- Grid layout for products
- Responsive design
- Clear price breakdown
- Prominent "Add Selected to Cart" button

### 5. Props
```typescript
interface FrequentlyBoughtTogetherProps {
  productId: number;          // Current product ID
  onAddToCart: (products: Product[]) => void;  // Callback for adding to cart
}
```

### 6. State Management
```typescript
interface State {
  selectedProducts: Product[];
  loading: boolean;
  error: string | null;
}
```

### 7. Error Handling
- Loading states
- API error handling
- Fallback UI when no related products
