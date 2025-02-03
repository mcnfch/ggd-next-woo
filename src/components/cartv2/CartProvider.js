    'use client';

import { CartProvider } from '@/hooks/useCart';
import CartSlideout from './CartSlideout';

const CartWrapper = ({ children }) => {
  return (
    <CartProvider>
      {children}
      <CartSlideout />
    </CartProvider>
  );
};

export default CartWrapper;
