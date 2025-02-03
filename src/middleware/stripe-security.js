import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Simple in-memory store for rate limiting
// In production, use Redis or similar for distributed rate limiting
const requestStore = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

/**
 * Rate limiting middleware
 */
export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean up old entries
  for (const [key, value] of requestStore.entries()) {
    if (value.timestamp < windowStart) {
      requestStore.delete(key);
    }
  }

  const requestData = requestStore.get(ip) || { count: 0, timestamp: now };

  if (requestData.timestamp < windowStart) {
    requestData.count = 0;
    requestData.timestamp = now;
  }

  requestData.count++;
  requestStore.set(ip, requestData);

  return requestData.count <= MAX_REQUESTS_PER_WINDOW;
}

/**
 * Validate Stripe webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  try {
    stripe.webhooks.constructEvent(payload, signature, secret);
    return true;
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err });
    return false;
  }
}

/**
 * Validate request payload
 */
export function validatePaymentRequest(data: any): boolean {
  const requiredFields = ['amount', 'currency'];
  const hasRequiredFields = requiredFields.every(field => 
    data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined
  );

  if (!hasRequiredFields) {
    return false;
  }

  // Validate amount
  if (typeof data.amount !== 'number' || data.amount <= 0) {
    return false;
  }

  // Validate currency
  if (typeof data.currency !== 'string' || data.currency.length !== 3) {
    return false;
  }

  return true;
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(headers: Headers): Headers {
  // Set strict security headers
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Content-Security-Policy', "default-src 'self' https://api.stripe.com");

  return headers;
}

/**
 * Main security middleware
 */
export async function stripeSecurityMiddleware(
  req: Request,
  endpoint: 'payment' | 'webhook'
) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const headers = new Headers();

  // Add security headers
  addSecurityHeaders(headers);

  // Check rate limit
  if (!rateLimit(ip)) {
    logger.warn('Rate limit exceeded', { ip });
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers }
    );
  }

  // For webhooks, verify signature
  if (endpoint === 'webhook') {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      logger.error('Missing webhook signature', { ip });
      return new NextResponse(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers }
      );
    }

    const payload = await req.text();
    const isValid = validateWebhookSignature(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (!isValid) {
      logger.error('Invalid webhook signature', { ip });
      return new NextResponse(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers }
      );
    }

    return { isValid: true, payload, headers };
  }

  // For payment requests, validate payload
  if (endpoint === 'payment') {
    const data = await req.json();
    if (!validatePaymentRequest(data)) {
      logger.error('Invalid payment request', { ip, data });
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers }
      );
    }

    return { isValid: true, data, headers };
  }

  return { isValid: false, headers };
}
