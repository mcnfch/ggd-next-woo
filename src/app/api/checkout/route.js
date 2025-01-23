import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session-config';
import { cookies } from 'next/headers';

// Use the test key in development, live key in production
const stripeSecretKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY_TEST;

const stripe = new Stripe(stripeSecretKey);

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    const data = await request.json();
    const { items } = data;

    console.log('Processing checkout with items:', items);

    // Validate cart has items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate total amount in cents
    const amount = Math.round(items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price);
      if (isNaN(itemPrice)) {
        throw new Error(`Invalid price for item ${item.name}: ${item.price}`);
      }
      return total + (itemPrice * item.quantity);
    }, 0) * 100);

    if (amount < 50) {
      throw new Error('Order total must be at least $0.50');
    }

    console.log('Calculated amount:', amount);

    // Check for existing payment intent
    const paymentIntentId = cookieStore.get('paymentIntentId')?.value;
    let paymentIntent;

    if (paymentIntentId) {
      try {
        console.log('Retrieving existing payment intent:', paymentIntentId);
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        // If amount changed, update the payment intent
        if (paymentIntent.amount !== amount) {
          console.log('Updating payment intent amount from', paymentIntent.amount, 'to', amount);
          paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
            amount: amount
          });
        }
      } catch (error) {
        console.error('Error retrieving payment intent:', error);
        // If error retrieving, create new one
        paymentIntent = null;
      }
    }

    // Create new payment intent if needed
    if (!paymentIntent) {
      console.log('Creating new payment intent with amount:', amount);
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          user_id: session?.user?.id || 'guest',
          order_items: JSON.stringify(items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })))
        }
      });

      // Store payment intent ID in cookie
      cookieStore.set('paymentIntentId', paymentIntent.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 30 // 30 minutes
      });
    }

    console.log('Returning client secret for payment intent:', paymentIntent.id);

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100 // Send back formatted amount for verification
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('must be at least') ? 400 : 500 }
    );
  }
}
