import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

// Import reducers and state types
import type { AuthState } from './slices/authSlice';
import type { CartState } from './slices/cartSlice';
import type { ProductState } from './slices/productSlice';
import type { UIState } from './slices/uiSlice';

import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import uiReducer from './slices/uiSlice';

export interface RootState {
  auth: AuthState;
  cart: CartState;
  product: ProductState;
  ui: UIState;
}

// Create the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    product: productReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for non-serializable values
        ignoredActions: ['auth/loginSuccess', 'auth/logout'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;