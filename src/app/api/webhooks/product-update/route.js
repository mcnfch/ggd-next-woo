import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

function verifyWooCommerceSignature(signature, payload) {
  const expectedSignature = createHmac('sha256', process.env.SESSION_PASSWORD)
    .update(payload)
    .digest('base64');
  return signature === `sha256=${expectedSignature}`;
}

export async function POST(request) {
  try {
    // Get the raw body as text for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-wc-webhook-signature');

    // Verify the signature
    if (!verifyWooCommerceSignature(signature, rawBody)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the body
    const data = JSON.parse(rawBody);
    const { id, type } = data;

    // Publish to Redis for real-time updates
    await redis.publish('product-updates', JSON.stringify({
      type: type, // 'updated' or 'deleted'
      productId: id,
      timestamp: Date.now(),
      data: data
    }));

    // Trigger cache invalidation
    await redis.publish('product-cache-invalidation', JSON.stringify({
      productId: id,
      timestamp: Date.now()
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
