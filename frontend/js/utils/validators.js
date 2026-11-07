/**
 * Form Validation Utilities
 */

export function validateRequired(value, fieldName = 'This field') {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateNumber(value, fieldName = 'Value', min = 0, isInteger = false) {
  if (value === '' || value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min) {
    return `${fieldName} cannot be less than ${min}`;
  }
  if (isInteger && !Number.isInteger(num)) {
    return `${fieldName} must be a whole number`;
  }
  return null;
}

export function validateSKU(sku, existingProducts = [], currentProductId = null) {
  const reqError = validateRequired(sku, 'SKU');
  if (reqError) return reqError;

  const normalized = String(sku).trim().toUpperCase();
  const duplicate = existingProducts.find(p =>
    p.sku.toUpperCase() === normalized && p.id !== currentProductId
  );

  if (duplicate) {
    return `SKU "${normalized}" is already assigned to "${duplicate.name}"`;
  }
  return null;
}

export function validateEmail(email) {
  if (!email || String(email).trim() === '') return null; // optional unless required
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(String(email).trim())) {
    return 'Please enter a valid email address';
  }
  return null;
}
