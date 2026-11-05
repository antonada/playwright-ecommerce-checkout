export type CheckoutData = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

export type CheckoutField = keyof CheckoutData;

export type CartSeedItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

// Mirrors app/data/products.json. Prices are in cents.
export const products = {
  backpack: { id: 'p-101', name: 'Trail Runner Backpack 22L', price: 6900 },
  headphonesPro: { id: 'p-201', name: 'Wireless Headphones Pro', price: 12900 },
  studioHeadphones: { id: 'p-202', name: 'Studio Headphones', price: 8900 },
  waterBottle: { id: 'p-301', name: 'Insulated Water Bottle 750ml', price: 2400 },
  headlamp: { id: 'p-302', name: 'Camping Headlamp', price: 1950 },
  coffeeSet: { id: 'p-401', name: 'Ceramic Pour-Over Coffee Set', price: 4000 },
  skillet: { id: 'p-402', name: 'Cast Iron Skillet 10"', price: 3600 },
} as const;

export const CATALOG_SIZE = 12;

function formatExpiry(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear() % 100).padStart(2, '0');
  return `${month}/${year}`;
}

export const expiry = {
  thisMonth: () => formatExpiry(new Date()),
  lastMonth: () => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return formatExpiry(d);
  },
  inTwoYears: () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return formatExpiry(d);
  },
};

export const validCustomer: CheckoutData = {
  fullName: 'Jane Cooper',
  email: 'jane.cooper@example.com',
  phone: '+1 503 555 0142',
  address: '1200 NW Naito Pkwy',
  city: 'Portland',
  zip: '97209',
  cardNumber: '4242 4242 4242 4242',
  expiry: expiry.inTwoYears(),
  cvv: '123',
};

export const requiredFieldMessages: Record<CheckoutField, string> = {
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
