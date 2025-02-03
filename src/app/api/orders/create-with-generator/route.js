import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session-config';
import { parsePrice, formatWooCommercePrice, isValidPrice } from '@/utils/price';

export async function POST(request) {
  try {
    const session = await getIronSession(request.cookies, sessionOptions);
    const { shipping, items, paymentIntent } = await request.json();

    // Verify the payment intent status from the frontend
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    // Create the order using WooCommerce API
    const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/v3/orders?consumer_key=${process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY}&consumer_secret=${process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'processing',
        payment_method: 'stripe',
        payment_method_title: 'Credit Card (Stripe)',
        customer_id: session.user?.id || 0,
        billing: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          email: session.user?.email || 'noemail@example.com',
          address_1: shipping.address1,
          address_2: shipping.address2 || '',
          city: shipping.city,
          state: shipping.state,
          postcode: shipping.postcode,
          country: shipping.country,
          phone: shipping.phone || ''
        },
        shipping: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          address_1: shipping.address1,
          address_2: shipping.address2 || '',
          city: shipping.city,
          state: shipping.state,
          postcode: shipping.postcode,
          country: shipping.country
        },
        line_items: items.map(item => {
          const total = (parseFloat(item.price) * parseInt(item.quantity)).toFixed(2);
          return {
            product_id: parseInt(item.id),
            quantity: parseInt(item.quantity),
            total: total.toString(),
            subtotal: total.toString()
          };
        }),
        meta_data: [
          {
            key: 'stripe_payment_intent_id',
            value: paymentIntent.id
          },
          {
            key: 'stripe_amount',
            value: (paymentIntent.amount / 100).toFixed(2)
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('WooCommerce API Error:', errorData);
      throw new Error(`Failed to create order: ${errorData}`);
    }

    const order = await response.json();
    
    // Clear the cart after successful order creation
    if (session.cart) {
      session.cart = { items: [], total: 0 };
      await session.save();
    }

    return NextResponse.json({ orderId: order.id });

  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
