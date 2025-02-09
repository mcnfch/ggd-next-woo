'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchMenu, organizeMenuItems } from '../utils/api';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from './auth/AuthModal';
import { UserIcon as UserIconOutline } from '@heroicons/react/24/outline';
import { UserIcon as UserIconSolid } from '@heroicons/react/24/solid';
import '../styles/fonts.css';

const decodeHTML = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const Header = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { handleCartClick, cartCount } = useCart();
  const { user, openLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const getMenuItems = async () => {
      try {
        setLoading(true);
        const items = await fetchMenu(436); // primary menu ID
        const organized = organizeMenuItems(items);
        setMenuItems(organized);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getMenuItems();
  }, []);

  const toggleSubmenu = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleMobileMenu = (value) => {
    setMobileMenuOpen(value);
    if (!value) { // if we're closing the menu
      setExpandedItems({});
    }
  };

  return (
    <header className="bg-black sticky top-0 z-50 shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-white text-2xl font-bold">
            Groovy Gallery Designs
          </Link>

          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {loading ? (
                <div className="text-white">Loading menu...</div>
              ) : error ? (
                <div className="text-white">Error loading menu: {error}</div>
              ) : (
                <>
                  {menuItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <Link
                        href={item.url}
                        className="text-white py-4 hover:text-gray-300 transition-colors duration-200 flex items-center whitespace-nowrap"
                      >
                        {item.title}
                        {item.children?.length > 0 && (
                          <svg className="w-4 h-4 ml-1 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </Link>
                      {item.children?.length > 0 && (
                        <div className="absolute left-0 top-full mt-0 w-auto min-w-[250px] bg-black invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                          <div className="py-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.url}
                                className="block px-6 py-2 text-white hover:bg-gray-800 whitespace-normal"
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="relative group">
                    <Link
                      href="/custom-designs"
                      className="text-white py-4"
                    >
                      Custom Designs
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* User Icon and Cart */}
            <div className="flex items-center space-x-4">
              {children}
              <div className="ml-4">
                {user ? (
                  <Link href="/account" className="inline-block" aria-label="View your account">
                    <UserIconSolid className="h-6 w-6 text-white cursor-pointer" aria-hidden="true" />
                  </Link>
                ) : (
                  <button 
                    onClick={openLogin}
                    aria-label="Sign in to your account"
                  >
                    <UserIconOutline className="h-6 w-6 text-white cursor-pointer" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Shopping Bag */}
              <button 
                onClick={handleCartClick}
                className="text-white hover:text-gray-300 relative"
                aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ', empty'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold" aria-hidden="true">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => toggleMobileMenu(!mobileMenuOpen)}
                className="md:hidden p-2 text-white"
                aria-label={`${mobileMenuOpen ? 'Close' : 'Open'} menu`}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4" id="mobile-menu">
            {loading ? (
              <div className="text-white">Loading menu...</div>
            ) : error ? (
              <div className="text-white">Error loading menu: {error}</div>
            ) : (
              <>
                {menuItems.map((item) => (
                  <div key={`mobile-${item.id}`}>
                    <div className="flex items-center justify-between">
                      <Link
                        href={item.url}
                        className="text-white py-2 block"
                        onClick={() => toggleMobileMenu(false)}
                      >
                        {item.title}
                      </Link>
                      {item.children?.length > 0 && (
                        <button
                          onClick={() => toggleSubmenu(item.id)}
                          className="p-2 text-white"
                        >
                          <svg
                            className={`w-4 h-4 transform transition-transform ${
                              expandedItems[item.id] ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {item.children?.length > 0 && expandedItems[item.id] && (
                      <div className="pl-4 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={`mobile-submenu-${child.id}`}
                            href={child.url}
                            className="text-white py-2 pl-4 block break-words whitespace-normal"
                            onClick={() => toggleMobileMenu(false)}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div>
                  <Link
                    href="/custom-designs"
                    className="text-white py-2 block"
                    onClick={() => toggleMobileMenu(false)}
                  >
                    Custom Designs
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={false}
        onClose={() => {}}
      />
    </header>
  );
};

export default Header;
