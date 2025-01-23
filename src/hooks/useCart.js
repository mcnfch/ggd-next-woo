'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { parsePrice } from '@/utils/price';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    // Calculate total items in cart
    const totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setCartCount(totalItems);
  }, [cart.items]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      // Ensure total is always a number
      setCart({
        ...data,
        total: typeof data.total === 'number' ? data.total : 0,
        items: Array.isArray(data.items) ? data.items : []
      });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Set default state on error
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (data) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-item',
          ...data,
          price: parsePrice(data.price)
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add item to cart');
      }
      
      const updatedCart = await response.json();
      setCart(updatedCart);
      setIsOpen(true); // Open cart slider when item is added
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  };

  const removeItem = async (key) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove-item',
          key
        }),
      });
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    }
  };

  const updateQuantity = async (key, quantity) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-quantity',
          key,
          quantity
        }),
      });
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await fetch('/api/cart/clear', { method: 'POST' });
      setCart({ items: [], total: 0 });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const handleCartClick = () => {
    setIsOpen(true);
  };

  const closeCart = () => {
    setIsOpen(false);
  };

  // Format cart data for Stripe
  const formatStripeItems = () => {
    return cart.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.images
        },
        unit_amount: Math.round(parsePrice(item.price) * 100) // Convert to cents
      },
      quantity: item.quantity
    }));
  };

  // Get cart total in cents for Stripe
  const getStripeTotalAmount = () => {
    return Math.round(cart.total * 100);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isOpen,
        cartCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        handleCartClick,
        closeCart,
        fetchCart,
        formatStripeItems,
        getStripeTotalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
