import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { logger } from './logger';
import { formatWooCommercePrice, fromCents } from '@/utils/price';

const WOOCOMMERCE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;
const WOO_API_VERSION = 'v3';

const WooCommerce = WooCommerceRestApi.default;
const api = new WooCommerce({
  url: WOOCOMMERCE_URL,
  consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
  version: "wc/v3",
});

const desiredCategories = [
  "new-arrivals",
  "accessories",
  "women",
  "men",
  "groovy-gear",
  "custom-designs"
];

export async function getTopLevelCategories() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/v3/products/categories?parent=0&per_page=100`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(
            process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY + ':' + 
            process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET
          ).toString('base64')
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Create a mapping of slugs to their desired order
    const orderMap = Object.fromEntries(
      desiredCategories.map((slug, index) => [slug, index])
    );

    // Filter and sort categories according to desiredCategories
    const sortedCategories = data
      .filter(category => 
        category.slug !== 'uncategorized' &&
        desiredCategories.includes(category.slug)
      )
      .sort((a, b) => orderMap[a.slug] - orderMap[b.slug]);

    // If any desired category is missing, create a placeholder for it
    const finalCategories = desiredCategories.map(slug => {
      const existingCategory = sortedCategories.find(cat => cat.slug === slug);
      if (existingCategory) return existingCategory;

      // Create placeholder for missing categories
      return {
        id: `placeholder-${slug}`,
        name: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        slug: slug,
        description: `Explore our ${slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} collection`,
        image: null
      };
    });

    return finalCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Cart-related functions using Store API through Next.js API routes
const storeApi = {
  async fetchWithError(method, action = null, data = null) {
    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      };

      if (data) {
        options.body = JSON.stringify({ action, ...data });
      }

      const response = await fetch('/api/cart', options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getCart() {
    return this.fetchWithError('GET');
  },

  async addToCart(productId, quantity = 1, variation = {}) {
    return this.fetchWithError('POST', 'add-item', {
      id: productId,
      quantity,
      variation,
    });
  },

  async updateCartItem(key, quantity) {
    return this.fetchWithError('POST', 'update-item', {
      key,
      quantity,
    });
  },

  async removeCartItem(key) {
    return this.fetchWithError('POST', 'remove-item', {
      key,
    });
  },
};

export async function createWooOrder({
  paymentIntentId,
  billingDetails,
  shippingDetails,
  cartItems,
  total
}) {
  try {
    // Convert total from cents to dollars if needed and ensure it's a number
    const orderTotal = typeof total === 'number' && total > 100 
      ? fromCents(total) 
      : parseFloat(total);

    // Calculate total from line items as a fallback
    const calculatedTotal = cartItems.reduce((sum, item) => {
      const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
      return sum + (itemPrice * item.quantity);
    }, 0);

    // Use the calculated total if the provided total seems incorrect
    const finalTotal = !isNaN(orderTotal) && orderTotal > 0 ? orderTotal : calculatedTotal;

    const orderData = {
      payment_method: 'stripe',
      payment_method_title: 'Credit Card (Stripe)',
      set_paid: false,
      status: 'pending',
      currency: 'USD',
      prices_include_tax: false,
      transaction_id: paymentIntentId,
      cart_tax: '0.00',
      billing: {
        first_name: billingDetails.firstName,
        last_name: billingDetails.lastName,
        company: billingDetails.company || '',
        address_1: billingDetails.address1,
        address_2: billingDetails.address2 || '',
        city: billingDetails.city,
        state: billingDetails.state,
        postcode: billingDetails.postcode,
        country: billingDetails.country,
        email: billingDetails.email,
        phone: billingDetails.phone || ''
      },
      shipping: {
        first_name: shippingDetails.firstName,
        last_name: shippingDetails.lastName,
        company: shippingDetails.company || '',
        address_1: shippingDetails.address1,
        address_2: shippingDetails.address2 || '',
        city: shippingDetails.city,
        state: shippingDetails.state,
        postcode: shippingDetails.postcode,
        country: shippingDetails.country
      },
      line_items: cartItems.map(item => {
        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
        const subtotal = itemPrice * item.quantity;
        return {
          product_id: parseInt(item.id),
          name: item.name,
          quantity: item.quantity,
          ...(item.selectedOptions?.variationId && { variation_id: parseInt(item.selectedOptions.variationId) }),
          subtotal: formatWooCommercePrice(subtotal),
          subtotal_tax: '0.00',
          total: formatWooCommercePrice(subtotal),
          total_tax: '0.00',
          meta_data: [
            {
              key: 'stripe_line_item_id',
              value: item.id.toString()
            },
            {
              key: 'image_url',
              value: item.images?.[0]?.src || ''
            },
            ...Object.entries(item.selectedOptions || {}).map(([key, value]) => ({
              key: `option_${key}`,
              value: value.toString()
            }))
          ]
        };
      }),
      meta_data: [
        {
          key: 'stripe_payment_intent_id',
          value: paymentIntentId
        },
        {
          key: 'stripe_total_cents',
          value: total.toString()
        },
        {
          key: 'stripe_total_formatted',
          value: formatWooCommercePrice(finalTotal)
        }
      ],
      total: formatWooCommercePrice(finalTotal),
      total_tax: '0.00'
    };

    logger.info('Creating WooCommerce order with data:', {
      orderId: null,
      paymentIntentId,
      total: finalTotal,
      calculatedTotal,
      originalTotal: total,
      itemCount: cartItems.length,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }))
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/${WOO_API_VERSION}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(
          process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY + ':' + 
          process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET
        ).toString('base64')
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('WooCommerce order creation failed:', {
        status: response.status,
        error: errorData,
        orderTotal: finalTotal,
        paymentIntentId,
        requestData: orderData
      });
      throw new Error(`WooCommerce order creation failed: ${errorData.message}`);
    }

    const order = await response.json();
    logger.info('WooCommerce order created successfully', {
      orderId: order.id,
      paymentIntentId,
      total: order.total,
      status: order.status,
      lineItems: order.line_items
    });

    return order;
  } catch (error) {
    logger.error('Error creating WooCommerce order:', {
      error: error.message,
      paymentIntentId,
      stack: error.stack
    });
    throw error;
  }
}

export async function getWooOrder(orderId) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/${WOO_API_VERSION}/orders/${orderId}`,
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(
            process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY + ':' + 
            process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET
          ).toString('base64')
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch WooCommerce order: ${errorData.message}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching WooCommerce order:', {
      error: error.message,
      orderId
    });
    throw error;
  }
}

export async function updateWooOrderStatus(orderId, status = 'processing') {
  try {
    logger.info('Updating WooCommerce order status:', {
      orderId,
      newStatus: status
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wc/${WOO_API_VERSION}/orders/${orderId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(
            process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY + ':' + 
            process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET
          ).toString('base64')
        },
        body: JSON.stringify({
          status,
          set_paid: true,
          date_paid: new Date().toISOString(),
          date_paid_gmt: new Date().toISOString(),
          meta_data: [
            {
              key: '_stripe_charge_captured',
              value: 'yes'
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Failed to update WooCommerce order status:', {
        orderId,
        status,
        error: errorData
      });
      throw new Error(`Failed to update order status: ${errorData.message}`);
    }

    const updatedOrder = await response.json();
    logger.info('WooCommerce order status updated successfully:', {
      orderId,
      status: updatedOrder.status
    });

    return updatedOrder;
  } catch (error) {
    logger.error('Error updating WooCommerce order status:', {
      orderId,
      status,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export { api, storeApi };