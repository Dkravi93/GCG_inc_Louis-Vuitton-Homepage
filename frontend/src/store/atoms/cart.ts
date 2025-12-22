import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    variant: {
        color: string;
        size: string;
        sku: string;
    };
}

export const cartItemsAtom = atomWithStorage<CartItem[]>('cart', []);
export const cartIsOpenAtom = atom(false);

export const cartTotalItemsAtom = atom((get) => {
    const items = get(cartItemsAtom);
    return items.reduce((total, item) => total + item.quantity, 0);
});

export const cartTotalPriceAtom = atom((get) => {
    const items = get(cartItemsAtom);
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
});
