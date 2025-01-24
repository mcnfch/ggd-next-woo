# Groovy Gallery Designs - Next.js E-commerce Platform

A modern, feature-rich e-commerce platform built with Next.js 15, WooCommerce integration, and Stripe payments.

## Features

### 🛍️ Shopping Experience
- **Product Catalog**
  - Dynamic product listings with categories
  - Advanced product filtering and search
  - Product image galleries with zoom functionality
  - Detailed product descriptions and variants
  - Related products suggestions

- **Shopping Cart**
  - Real-time cart updates
  - Persistent cart storage using Redis
  - Multiple product variants support
  - Quantity adjustments
  - Cart summary with totals

- **Checkout Process**
  - Secure Stripe payment integration
  - Guest checkout support
  - Order summary review
  - Success/Cancel order handling
  - Free shipping thresholds

### 👤 User Features
- **Account Management**
  - User registration and login
  - Order history
  - Account details management
  - Saved shipping addresses

- **Custom Designs**
  - Custom design request system
  - Project requirements submission
  - Design consultation booking

### 📱 User Interface
- **Responsive Design**
  - Mobile-first approach
  - Tailwind CSS styling
  - Optimized for all screen sizes
  - Modern UI components using HeadlessUI

- **Enhanced UX**
  - Newsletter subscription with Mailchimp
  - Social sharing buttons
  - Blog carousel for content
  - Loading states and animations

### 🔧 Technical Features
- **Performance**
  - Next.js App Router
  - Server-side rendering
  - Image optimization
  - Redis caching
  - Sitemap generation

  ![Performance Metrics](public/images/Screenshot%202025-01-24%20at%206.36.36%E2%80%AFPM.png)
  *Lighthouse performance score showing optimal loading and rendering metrics*

- **Security**
  - Iron Session management
  - Secure payment processing
  - Rate limiting on API routes
  - CORS protection

- **Integration**
  - WooCommerce REST API
  - Stripe Payment Gateway
  - Mailchimp Marketing
  - Social media sharing

## Prerequisites

### System Requirements
- Node.js 18.x or higher
- Redis 6.x or higher
- PM2 for production deployment
- HTTPS for production environment

### API Keys and Accounts
1. **WooCommerce**
   - WooCommerce store setup
   - REST API consumer key and secret

2. **Stripe**
   - Stripe account
   - API keys (publishable and secret)
   - Webhook secret for order processing

3. **Mailchimp**
   - Mailchimp account
   - API key
   - Audience ID
   - Server prefix

### Environment Variables
Create `.env.development` and `.env.production` with:
```env
# WooCommerce
PUBLIC_API_PROVIDER=Woocommerce
PUBLIC_DOMAIN=your-domain.com
PUBLIC_HTTP_ENDPOINT=https://your-woo-endpoint.com

# Stripe
STRIPE_SECRET_KEY=sk_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx

# Redis
REDIS_URL=redis://localhost:6379

# Session
SESSION_PASSWORD=your-secure-password

# Mailchimp
MAILCHIMP_API_KEY=xxx
MAILCHIMP_SERVER_PREFIX=xxx
MAILCHIMP_AUDIENCE_ID=xxx
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/ggd-next-woo.git
cd ggd-next-woo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start Redis server:
```bash
redis-server
```

5. Run development server:
```bash
npm run dev
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server with PM2
- `npm run stop` - Stop PM2 server
- `npm run generate-sitemaps` - Generate sitemaps

## Production Deployment

1. Set up production environment variables
2. Build the application:
```bash
npm run build
```

3. Start the production server:
```bash
npm run start
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **State Management**: React Hooks, Context API
- **Payment**: Stripe
- **Caching**: Redis
- **CMS**: WooCommerce
- **Email Marketing**: Mailchimp
- **Deployment**: PM2

## Support

For support, email support@groovygallerydesigns.com or open an issue in the repository.

## License

Proprietary - All Rights Reserved
