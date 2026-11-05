// Shared between the browser and the server, so both sides agree on what a valid order looks like.

export const CHECKOUT_FIELDS = [
  'fullName',
  'email',
  'phone',
  'address',
  'city',
  'zip',
  'cardNumber',
  'expiry',
  'cvv',
];

const REQUIRED_MESSAGES = {
  fullName: 'Full name is required',
  email: 'Email is required',
  phone: 'Phone number is required',
  address: 'Address is required',
  city: 'City is required',
  zip: 'Postal code is required',
  cardNumber: 'Card number is required',
  expiry: 'Expiry date is required',
  cvv: 'CVV is required',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]+$/;
const ZIP_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/;

export function passesLuhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

function checkExpiry(value, now) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return 'Use the MM/YY format';

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return 'Use the MM/YY format';

  // A card is still valid during its expiry month
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();
  if (year * 12 + (month - 1) < currentMonthIndex) return 'Card has expired';
  return null;
}

export function validateField(name, rawValue, now = new Date()) {
  const value = String(rawValue ?? '').trim();
  if (!value) return REQUIRED_MESSAGES[name] ?? null;

  switch (name) {
    case 'fullName':
      return value.length < 2 ? 'Enter your full name' : null;
    case 'email':
      return EMAIL_RE.test(value) ? null : 'Enter a valid email address';
    case 'phone': {
      const digits = value.replace(/\D/g, '');
      return PHONE_RE.test(value) && digits.length >= 7 && digits.length <= 15
        ? null
        : 'Enter a valid phone number';
    }
    case 'address':
      return value.length < 5 ? 'Enter your street address' : null;
    case 'city':
      return null;
    case 'zip':
      return ZIP_RE.test(value) ? null : 'Enter a valid postal code';
    case 'cardNumber': {
      const digits = value.replace(/[\s-]/g, '');
      if (!/^\d{13,19}$/.test(digits)) return 'Card number should be 13 to 19 digits';
      return passesLuhn(digits) ? null : 'Card number is invalid';
    }
    case 'expiry':
      return checkExpiry(value, now);
    case 'cvv':
      return /^\d{3,4}$/.test(value) ? null : 'CVV must be 3 or 4 digits';
    default:
      return null;
  }
}

export function validateCheckout(data, now = new Date()) {
  const errors = {};
  for (const field of CHECKOUT_FIELDS) {
    const message = validateField(field, data?.[field], now);
    if (message) errors[field] = message;
  }
  return errors;
}
