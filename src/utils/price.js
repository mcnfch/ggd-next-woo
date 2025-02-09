/**
 * Parses a price value to ensure consistent number format
 * @param {string|number} price - Price to parse
 * @returns {number} Parsed price as a number
 */
export const parsePrice = (price) => {
  if (typeof price === 'number' && !isNaN(price)) {
    return price;
  }
  return typeof price === 'string'
    ? parseFloat(price.replace(/[^0-9.]/g, '')) || 0
    : 0;
};

/**
 * Formats a price for WooCommerce API
 * @param {number} price - Price to format
 * @returns {string} Formatted price as string with 2 decimal places
 */
export const formatWooCommercePrice = (price) => {
  const parsedPrice = parsePrice(price);
  return parsedPrice.toFixed(2);
};

/**
 * Validates if a price is in the correct format
 * @param {any} price - Price to validate
 * @returns {boolean} True if price is valid
 */
export const isValidPrice = (price) => {
  const parsedPrice = parsePrice(price);
  return typeof parsedPrice === 'number' && !isNaN(parsedPrice) && parsedPrice >= 0;
};

/**
 * Converts price to cents for Stripe
 * @param {number|string} price - Price in dollars
 * @returns {number} Price in cents
 */
export const toCents = (price) => {
  const parsedPrice = parsePrice(price);
  return Math.round(parsedPrice * 100);
};

/**
 * Converts price from cents to dollars
 * @param {number} cents - Price in cents
 * @returns {number} Price in dollars
 */
export const fromCents = (cents) => {
  if (typeof cents !== 'number' || isNaN(cents)) return 0;
  return Number((cents / 100).toFixed(2));
};

/**
 * Validates price format and range
 * @param {number|string} price - Price to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum allowed price
 * @param {number} options.max - Maximum allowed price
 * @returns {boolean} True if price is valid
 */
export const validatePrice = (price, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsedPrice = parsePrice(price);
  return (
    typeof parsedPrice === 'number' &&
    !isNaN(parsedPrice) &&
    parsedPrice >= min &&
    parsedPrice <= max &&
    Number.isFinite(parsedPrice)
  );
};
