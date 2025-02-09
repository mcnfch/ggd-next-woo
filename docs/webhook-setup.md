# WooCommerce Webhook Setup Guide

## 1. Access WooCommerce Webhooks
1. Go to WooCommerce > Settings > Advanced > Webhooks
2. Click "Add webhook"

## 2. Configure Webhooks
Create two webhooks with these settings:

### Product Updated Webhook
- Name: Product Updated
- Status: Active
- Topic: Product updated
- Delivery URL: `https://${PUBLIC_DOMAIN}/api/webhooks/product-update`
- Secret: `${SESSION_PASSWORD}`
- API Version: v3

### Product Deleted Webhook
- Name: Product Deleted
- Status: Active
- Topic: Product deleted
- Delivery URL: `https://${PUBLIC_DOMAIN}/api/webhooks/product-update`
- Secret: `${SESSION_PASSWORD}`
- API Version: v3

## 3. Security Notes
- The webhook secret (`SESSION_PASSWORD`) is used to verify the authenticity of incoming webhooks
- Each webhook request includes an HMAC signature in the `x-wc-webhook-signature` header
- Our endpoint verifies this signature before processing the webhook

## 4. Testing
1. Create or update a product in WooCommerce
2. Check webhook delivery status in WooCommerce > Settings > Advanced > Webhooks
3. Monitor Redis channels:
   ```bash
   redis-cli
   subscribe product-updates product-cache-invalidation
   ```

## 5. Troubleshooting
- Verify `SESSION_PASSWORD` matches in both WooCommerce and .env.local
- Ensure the delivery URL is accessible from WooCommerce
- Check webhook logs in WooCommerce for delivery status
- Monitor server logs for signature verification failures
