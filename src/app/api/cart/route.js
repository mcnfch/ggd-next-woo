import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { parsePrice } from '@/utils/price';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const CART_COOKIE = 'cart_id';

async function getOrCreateCart(cartId) {
  let cart;
  if (cartId) {
    cart = await redis.get(`cart:${cartId}`);
    if (cart) {
      return JSON.parse(cart);
    }
  }
  
  // Create new cart if none exists
  return { items: [], total: 0 };
}

async function calculateTotal(items) {
  return items.reduce((sum, item) => {
    const price = parsePrice(item.price);
    return sum + (price * item.quantity);
  }, 0);
}

// Generate a unique key for cart item based on product ID and selected options
function generateItemKey(item) {
  const optionsKey = item.selectedOptions 
    ? Object.entries(item.selectedOptions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|')
    : '';
  return `${item.id}${optionsKey ? `|${optionsKey}` : ''}`;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cartId = cookieStore.get(CART_COOKIE)?.value;
    const cart = await getOrCreateCart(cartId);
    return NextResponse.json(cart);
  } catch (error) {
    console.error('Failed to get cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    let cartId = cookieStore.get(CART_COOKIE)?.value;
    
    if (!cartId) {
      cartId = uuidv4();
    }

    const cart = await getOrCreateCart(cartId);
    const requestData = await request.json();
    
    const { action, ...data } = requestData;

    switch (action) {
      case 'add-item': {
        const { item } = data;
        if (!item || !item.id || typeof item.price === 'undefined') {
          console.error('Invalid item data received:', data);
          return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
        }

        // Generate a unique key for the item based on its ID and selected options
        const itemKey = generateItemKey(item);
        const existingItem = cart.items.find(i => generateItemKey(i) === itemKey);

        if (existingItem) {
          existingItem.quantity += item.quantity || 1;
        } else {
          cart.items.push({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price) || 0,
            quantity: item.quantity || 1,
            images: Array.isArray(item.images) ? item.images : [],
            selectedOptions: item.selectedOptions || {},
            key: itemKey
          });
        }
        break;
      }

      case 'remove-item': {
        const { key } = data;
        cart.items = cart.items.filter(item => item.key !== key);
        break;
      }

      case 'update-quantity': {
        const { key, quantity } = data;
        const item = cart.items.find(item => item.key === key);
        if (item) {
          item.quantity = parseInt(quantity) || 1;
        }
        break;
      }

      default:
        throw new Error('Invalid action');
    }

    cart.total = await calculateTotal(cart.items);

    // Save cart
    await redis.set(`cart:${cartId}`, JSON.stringify(cart));
    
    // Set cookie if it doesn't exist
    const response = NextResponse.json(cart);
    if (!cookieStore.get(CART_COOKIE)) {
      response.cookies.set(CART_COOKIE, cartId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    return response;
  } catch (error) {
    console.error('Failed to update cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
