# Redis Product Data Implementation Guide

## Overview
This guide explains how to use Redis for product data caching in our e-commerce middleware system.

## Redis Configuration
- Redis server runs on port 6380
- Configuration file location: ./redis/redis.conf
- Connection is managed through Docker Compose

## Key Features
1. Product Caching
   - Products are cached using SHA-256 hash keys
   - Cache keys are generated from product data
   - Automatic cache invalidation on product updates

## Usage Examples

### Storing Product Data
```javascript
// Product data is automatically cached when transformed
const productData = transformProduct(webhookData);
// Cache key is generated using SHA-256 hash of the product data
// Access using: productData.cache_key
```

### Best Practices
1. Always use the transformProduct function for consistency
2. Implement cache invalidation on product updates
3. Use Redis for read-heavy operations
4. Monitor Redis memory usage

## Docker Setup
The Redis instance is configured in docker-compose.yml:
- Image: redis:7.2-alpine
- Custom configuration mounted from ./redis/redis.conf
- Part of app-network for container communication

## Troubleshooting
1. Check Redis connection: redis-cli -p 6380 ping
2. Monitor Redis: redis-cli -p 6380 monitor
3. Clear cache: redis-cli -p 6380 flushall

## Security Notes
- Redis is configured for internal network access only
- Ensure proper authentication in production
- Never expose Redis port directly to the internet
