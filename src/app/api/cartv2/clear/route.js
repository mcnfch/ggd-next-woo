import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Redis from 'ioredis';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session-config';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const CART_COOKIE = 'cart_id';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const cartId = cookieStore.get(CART_COOKIE)?.value;

    // Clear Redis cart data
    if (cartId) {
      await redis.del(`cart:${cartId}`);
      console.log('Cleared Redis cart:', cartId);
    }

    // Clear cart cookie
    cookies().delete(CART_COOKIE);
    console.log('Cleared cart cookie');

    // Clear session cart
    const session = await getIronSession(request.cookies, sessionOptions);
    if (session.cart) {
      delete session.cart;
      await session.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
