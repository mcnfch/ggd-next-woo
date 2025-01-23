// Next.js automatically loads environment variables
const sessionPassword = process.env.SESSION_PASSWORD;

// Debug environment variables
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  SESSION_PASSWORD_EXISTS: !!process.env.SESSION_PASSWORD,
  SESSION_PASSWORD_LENGTH: process.env.SESSION_PASSWORD?.length,
  ALL_ENV_KEYS: Object.keys(process.env),
  ACTUAL_PASSWORD: process.env.SESSION_PASSWORD // Only for debugging, remove in production
});

if (!sessionPassword) {
  console.error('Session password is missing!');
  throw new Error('SESSION_PASSWORD environment variable must be set');
}

export const cookieName = 'auth_session';

export const sessionOptions = {
  password: sessionPassword,
  cookieName,
  ttl: 7 * 24 * 60 * 60, // 7 days
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  }
};
