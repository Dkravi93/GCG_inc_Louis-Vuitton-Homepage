import { atom } from 'jotai';

export interface CartItem { 
  id: string; 
  name: string; 
  price: number; 
  quantity: number; 
  image?: string;
  variant?: {
    color: string;
    size: string;
    sku: string;
  };
  variants?: string[]; 
}

const CART_KEY = 'gcg_cart';

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]): void {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {
    /* ignore storage errors */
  }
}

export const cartItemsAtom = atom<CartItem[]>(readCart());

export const cartTotalAtom = atom((get) => get(cartItemsAtom).reduce((sum, i) => sum + i.price * i.quantity, 0));
export const cartCountAtom = atom((get) => get(cartItemsAtom).reduce((sum, i) => sum + i.quantity, 0));

export const addToCartAtom = atom(null, (get, set, item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
  const qty = item.quantity ?? 1;
  const current = get(cartItemsAtom);
  const idx = current.findIndex((c) => c.id === item.id);
  let next: CartItem[];
  if (idx >= 0) {
    next = current.map((c, i) => (i === idx ? { ...c, quantity: c.quantity + qty } : c));
  } else {
    next = [...current, { id: item.id, name: item.name, price: item.price, quantity: qty }];
  }
  set(cartItemsAtom, next);
  writeCart(next);
});

export const clearCartAtom = atom(null, (_get, set) => {
  set(cartItemsAtom, []);
  writeCart([]);
});

export const setQuantityAtom = atom(null, (get, set, payload: { id: string; quantity: number }) => {
  const current = get(cartItemsAtom);
  const next = current
    .map((c) => (c.id === payload.id ? { ...c, quantity: payload.quantity } : c))
    .filter((c) => c.quantity > 0);
  set(cartItemsAtom, next);
  writeCart(next);
});

export const removeItemAtom = atom(null, (get, set, id: string) => {
  const current = get(cartItemsAtom);
  const next = current.filter((c) => c.id !== id);
  set(cartItemsAtom, next);
  writeCart(next);
});

export const cartDrawerOpenAtom = atom<boolean>(false);


