import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  variants: Array<{
    color: string;
    size: string;
    sku: string;
    stock: number;
  }>;
  featured: boolean;
  onSale: boolean;
}

export interface ProductState {
  items: Product[];
  currentProduct: Product | null;
  filteredItems: Product[];
  filters: {
    category?: string;
    color?: string;
    priceRange?: [number, number];
    onSale?: boolean;
  };
  sort: 'new' | 'price_asc' | 'price_desc';
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const initialState: ProductState = {
  items: [],
  currentProduct: null,
  filteredItems: [],
  filters: {},
  sort: 'new',
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 12,
    total: 0,
  },
};

// Async Thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: { 
    page?: number; 
    pageSize?: number;
    category?: string;
    sort?: string;
  }) => {
    // Convert numeric values to strings for URLSearchParams
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.category) searchParams.set('category', params.category);
    if (params.sort) searchParams.set('sort', params.sort);

    const response = await api.get<{ items: Product[]; total: number }>(`/products?${searchParams}`);
    return response;
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string) => {
    const product = await api.get<Product>(`/products/${id}`);
    return product;
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query: string) => {
    const products = await api.get<Product[]>(`/products/search?q=${query}`);
    return products;
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<typeof state.filters>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset to first page when filters change
    },
    setSort: (state, action: PayloadAction<typeof state.sort>) => {
      state.sort = action.payload;
      state.pagination.page = 1; // Reset to first page when sort changes
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.filteredItems = action.payload.items;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch product';
      })
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredItems = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Search failed';
      });
  },
});

export const {
  setFilters,
  setSort,
  setPage,
  clearFilters,
  clearError,
} = productSlice.actions;

// Selectors
export const selectAllProducts = (state: { product: ProductState }) => state.product.items;
export const selectCurrentProduct = (state: { product: ProductState }) => state.product.currentProduct;
export const selectFilteredProducts = (state: { product: ProductState }) => state.product.filteredItems;
export const selectProductFilters = (state: { product: ProductState }) => state.product.filters;
export const selectProductSort = (state: { product: ProductState }) => state.product.sort;
export const selectProductPagination = (state: { product: ProductState }) => state.product.pagination;
export const selectProductLoading = (state: { product: ProductState }) => state.product.loading;
export const selectProductError = (state: { product: ProductState }) => state.product.error;

export default productSlice.reducer;