/**
 * Helper functions for common operations
 */

/**
 * Converts a value to a number if possible, otherwise returns the default value
 * @param {*} value - The value to convert
 * @param {*} [defaultValue=0] - The default value to return if conversion fails
 * @returns {number} The converted number or default value
 */
const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
};

/**
 * Converts a value to a boolean
 * @param {*} value - The value to convert
 * @returns {boolean} The boolean value
 */
const toBool = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (value === '1') return true;
    if (value === '0') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
};

/**
 * Checks if a value is a string representation of 'true'
 * @param {*} value - The value to check
 * @returns {boolean} True if the value is 'true' (case-insensitive), '1', or boolean true
 */
const isTrue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
};

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - The value to check
 * @returns {boolean} True if the value is empty
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Truncates a string to a specified length and adds an ellipsis if needed
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length of the string
 * @param {string} [ellipsis='...'] - The ellipsis string to append if truncated
 * @returns {string} The truncated string
 */
const truncate = (str, maxLength, ellipsis = '...') => {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}${ellipsis}`;
};

/**
 * Generates a random string of specified length
 * @param {number} length - The length of the random string
 * @returns {string} The random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Converts a string to title case
 * @param {string} str - The string to convert
 * @returns {string} The title-cased string
 */
const toTitleCase = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Sanitizes a string by removing HTML tags and trimming whitespace
 * @param {string} str - The string to sanitize
 * @returns {string} The sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

/**
 * Formats a date to a human-readable string
 * @param {Date|string|number} date - The date to format
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @param {Object} [options] - Options for date formatting
 * @returns {string} The formatted date string
 */
const formatDate = (date, locale = 'en-US', options = {}) => {
  try {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dateObj.getTime())) return '';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    return dateObj.toLocaleDateString(locale, defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Deep clones an object
 * @param {Object} obj - The object to clone
 * @returns {Object} A deep clone of the object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  
  const cloned = {};
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key]);
  });
  
  return cloned;
};

/**
 * Debounces a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

module.exports = {
  toNumber,
  toBool,
  isTrue,
  isEmpty,
  truncate,
  generateRandomString,
  toTitleCase,
  sanitizeString,
  formatDate,
  deepClone,
  debounce
};
