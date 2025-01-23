import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

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
    const price = typeof item.price === 'number' ? item.price : 
                 typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : 0;
    return sum + (price * (item.quantity || 1));
  }, 0);
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
    console.log('Cart API received data:', JSON.stringify(requestData, null, 2));
    
    const { action, ...data } = requestData;

    switch (action) {
      case 'add-item': {
        console.log('Adding item to cart:', JSON.stringify(data, null, 2));
        // Handle potentially nested item structure
        const itemData = data.item?.item || data.item || data;
        
        if (!itemData || !itemData.id) {
          console.error('Invalid item data received:', data);
          return NextResponse.json({ message: 'Invalid item data: missing id' }, { status: 400 });
        }

        // Parse price safely
        const price = typeof itemData.price === 'number' ? itemData.price : 
                     typeof itemData.price === 'string' ? parseFloat(itemData.price.replace(/[^0-9.]/g, '')) : 0;
        
        if (isNaN(price)) {
          console.error('Invalid price received:', itemData.price);
          return NextResponse.json({ message: 'Invalid price format' }, { status: 400 });
        }

        const existingItem = cart.items.find(i => i.key === itemData.key);

        if (existingItem) {
          existingItem.quantity += itemData.quantity || 1;
        } else {
          cart.items.push({
            id: itemData.id,
            name: itemData.name,
            price: price,
            quantity: itemData.quantity || 1,
            variation: itemData.variation || {},
            images: Array.isArray(itemData.images) && itemData.images.length > 0
              ? itemData.images.map(img => typeof img === 'string' ? img : img.src || '')
              : [],
            key: itemData.key || `${itemData.id}-${Object.values(itemData.variation || {}).join('-')}`
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
    await redis.set(`cart:${cartId}`, JSON.stringify(cart));
    
    const response = NextResponse.json(cart);
    if (!cookieStore.get(CART_COOKIE)) {
      response.cookies.set(CART_COOKIE, cartId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
    return response;
  } catch (error) {
    console.error('Failed to update cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
