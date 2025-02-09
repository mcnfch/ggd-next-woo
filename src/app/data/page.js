import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session-config';

const WC_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;

export default async function DataPage() {
  const cookieStore = await cookies();
  const session = await getIronSession(cookieStore, sessionOptions);
  let isAdmin = false;

  if (session.user?.token) {
    try {
      const response = await fetch(`${WC_URL}/wp-json/wc/v3/system_status`, {
        headers: {
          'Authorization': `Bearer ${session.user.token}`
        }
      });

      // If user can access system_status endpoint, they are an admin
      isAdmin = response.ok;
      
      console.log('Admin check response status:', response.status);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  console.log('Session user:', session.user);
  console.log('Is admin:', isAdmin);

  return (
    <div className="container mx-auto min-h-screen flex items-center justify-center">
      {isAdmin ? (
        <h1 className="text-3xl font-bold">Welcome Admin</h1>
      ) : (
        <h1 className="text-3xl font-bold">404 not found</h1>
      )}
    </div>
  );
}
