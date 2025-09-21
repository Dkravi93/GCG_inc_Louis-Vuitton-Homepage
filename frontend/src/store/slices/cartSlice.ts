import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

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

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
  isOpen: false,
  loading: false,
  error: null,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        item => 
          item.id === action.payload.id && 
          item.variant.sku === action.payload.variant.sku
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeItem: (state, action: PayloadAction<{ id: string; sku: string }>) => {
      state.items = state.items.filter(
        item => 
          !(item.id === action.payload.id && 
            item.variant.sku === action.payload.sku)
      );
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity: (
      state, 
      action: PayloadAction<{ id: string; sku: string; quantity: number }>
    ) => {
      const item = state.items.find(
        item => 
          item.id === action.payload.id && 
          item.variant.sku === action.payload.sku
      );
      
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cart');
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  toggleCart,
  setLoading,
  setError,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartIsOpen = (state: RootState) => state.cart.isOpen;
export const selectCartTotalItems = (state: RootState) => 
  state.cart.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
export const selectCartTotalPrice = (state: RootState) =>
  state.cart.items.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
export const selectCartError = (state: RootState) => state.cart.error;
export const selectCartLoading = (state: RootState) => state.cart.loading;

export default cartSlice.reducer;