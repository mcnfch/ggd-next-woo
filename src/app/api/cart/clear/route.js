import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Redis from 'ioredis';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session-config';
import { logger } from '@/lib/logger';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const CART_COOKIE = 'cart_id';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const cartId = await cookieStore.get(CART_COOKIE)?.value;

    // Clear Redis cart data first
    if (cartId) {
      await redis.del(`cart:${cartId}`);
      logger.info('Cleared Redis cart', { cartId });
    }

    // Clear session cart
    const session = await getIronSession(request.cookies, sessionOptions);
    if (session.cart) {
      delete session.cart;
      await session.save();
      logger.info('Cleared session cart');
    }

    // Clear cart cookie last
    const response = NextResponse.json({ success: true });
    await response.cookies.delete(CART_COOKIE);
    logger.info('Cleared cart cookie');

    return response;
  } catch (error) {
    logger.error('Error clearing cart:', { error: error.message });
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}
