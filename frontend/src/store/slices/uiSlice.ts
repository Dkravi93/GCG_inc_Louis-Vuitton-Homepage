import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  isFilterDrawerOpen: boolean;
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  isSidebarOpen: false,
  isSearchOpen: false,
  isFilterDrawerOpen: false,
  toast: {
    show: false,
    message: '',
    type: 'info',
  },
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
    },
    toggleFilterDrawer: (state) => {
      state.isFilterDrawerOpen = !state.isFilterDrawerOpen;
    },
    showToast: (state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>) => {
      state.toast = {
        show: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideToast: (state) => {
      state.toast.show = false;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
  },
});

export const {
  toggleSidebar,
  toggleSearch,
  toggleFilterDrawer,
  showToast,
  hideToast,
  setTheme,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.isSidebarOpen;
export const selectSearchOpen = (state: { ui: UIState }) => state.ui.isSearchOpen;
export const selectFilterDrawerOpen = (state: { ui: UIState }) => state.ui.isFilterDrawerOpen;
export const selectToast = (state: { ui: UIState }) => state.ui.toast;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;

export default uiSlice.reducer;