import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session-config';

export async function GET(request) {
  console.log('Auth check API called');
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    
    console.log('Session retrieved:', {
      hasUser: !!session.user,
      sessionKeys: Object.keys(session)
    });
    
    if (!session.user) {
      console.log('No user in session, returning 401');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // If we have a user but no token, return the basic user info
    if (!session.user.token) {
      console.log('No token in session, returning basic user info');
      return NextResponse.json({ user: session.user });
    }

    try {
      console.log('Fetching WooCommerce user data...');
      const response = await fetch(`${process.env.PUBLIC_HTTP_ENDPOINT}/wp-json/wc/v3/customers/${session.user.id}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('WooCommerce API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch user data:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        // Return existing session user data if WooCommerce fetch fails
        return NextResponse.json({ user: session.user });
      }

      const userData = await response.json();
      console.log('WooCommerce user data received');
      
      // Update user data with WooCommerce fields
      const updatedUser = {
        ...session.user,
        firstName: userData.first_name || session.user.firstName || '',
        lastName: userData.last_name || session.user.lastName || '',
        email: userData.email || session.user.email || '',
        avatar: userData.avatar_url || session.user.avatar || null,
        billing: userData.billing || {},
        shipping: userData.shipping || {}
      };

      // Update the session with the new user data
      session.user = updatedUser;
      await session.save();

      return NextResponse.json({ user: updatedUser });
    } catch (error) {
      console.error('Error fetching WooCommerce user data:', error);
      // Return basic user info if WooCommerce fetch fails
      return NextResponse.json({ user: session.user });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ message: 'Authentication error' }, { status: 500 });
  }
}
