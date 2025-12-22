const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000';

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '/vite.svg';
  return path.startsWith('http') ? path : `${BASE_URL}${path}`;
}

export interface AuthUserDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'admin' | 'superadmin';
  avatarUrl?: string;
  createdAt?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    locale?: string;
  }
}

// Order interfaces
export interface OrderItemProduct {
  _id: string;
  name: string;
  images: Array<{ url?: string }>;
  basePrice?: number;
  category?: string;
  brand?: string;
}

export interface OrderItem {
  product: OrderItemProduct;
  variant: {
    color: string;
    size: string;
    sku: string;
  };
  quantity: number;
  price: number;
}

export interface OrderAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderPayment {
  method: 'credit_card' | 'debit_card' | 'paypal' | 'upi' | 'net_banking' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  payuPaymentId?: string;
  payuOrderId?: string;
  gateway?: 'payu';
  gatewayResponse?: any;
}

export interface Order {
  _id: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  payment: OrderPayment;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetOrderByIdResponse {
  order: Order;
}

export interface AuthResponse {
  token: string;
  user: AuthUserDto;
}

// API utilities
export const apiUtils = {
  async post<T>(path: string, body: unknown): Promise<T> {
    const headers: HeadersInit = {};

    // If body is FormData, don't set Content-Type (browser will set it with boundary)
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });

    if (!res.ok) {
      try {
        const error = await res.json();
        throw new Error(error.message || 'Request failed');
      } catch (e) {
        throw new Error('Request failed');
      }
    }
    return res.json();
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      try {
        const error = await res.json();
        throw new Error(error.message || 'Request failed');
      } catch (e) {
        throw new Error('Request failed');
      }
    }
    return res.json();
  },

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: {},
      credentials: 'include',
    });
    if (!res.ok) {
      try {
        const error = await res.json();
        throw new Error(error.message || 'Request failed');
      } catch (e) {
        throw new Error('Request failed');
      }
    }
    return res.json();
  },

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {},
      credentials: 'include',
    });
    if (!res.ok) {
      try {
        const error = await res.json();
        throw new Error(error.message || 'Request failed');
      } catch (e) {
        throw new Error('Request failed');
      }
    }
    return res.json();
  },
};

// Auth API
export const authApi = {
  login: (payload: { email: string; password: string }) =>
    apiUtils.post<AuthResponse>('/auth/login', payload),
  register: (payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: 'user' | 'admin' | 'superadmin';
  }) => apiUtils.post<AuthResponse>('/auth/register', payload),
  getMe: () => apiUtils.get<{ user: AuthUserDto }>('/auth/me'),
  logout: () => apiUtils.post<{ message: string }>('/auth/logout', {}),
  updateMe: (payload: { firstName?: string; lastName?: string }) =>
    apiUtils.put<AuthResponse>('/auth/me', payload),
  updatePreferences: (payload: { theme?: 'light' | 'dark' | 'system'; locale?: string }) =>
    apiUtils.put<AuthResponse>('/auth/me/preferences', payload),
  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiUtils.post<AuthResponse>('/auth/me/avatar', formData);
  },
};

// Collections API
export const collectionsApi = {
  getAll: () => apiUtils.get<any[]>('/collections'),
  getById: (id: string) => apiUtils.get<any>(`/collections/${id}`),
  create: (data: any) => apiUtils.post<any>('/collections', data),
  update: (id: string, data: any) => apiUtils.put<any>(`/collections/${id}`, data),
  delete: (id: string) => apiUtils.delete<void>(`/collections/${id}`),
  addProduct: (id: string, productId: string) =>
    apiUtils.post<any>(`/collections/${id}/products`, { productId }),
  removeProduct: (id: string, productId: string) =>
    apiUtils.delete<any>(`/collections/${id}/products/${productId}`),
};

// Products API
export const productsApi = {
  getAll: () => apiUtils.get<any[]>('/products'),
  getById: (id: string) => apiUtils.get<any>(`/products/${id}`),
  create: (data: any) => apiUtils.post<any>('/products', data),
  update: (id: string, data: any) => apiUtils.put<any>(`/products/${id}`, data),
  delete: (id: string) => apiUtils.delete<void>(`/products/${id}`),
};

// Orders API
export const ordersApi = {
  getOrders: (params?: { page?: number; limit?: number; status?: string }) => {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiUtils.get<GetOrdersResponse>(`/orders${queryString}`);
  },
  getOrderById: async (id: string) => {
    try {
      return await apiUtils.get<GetOrderByIdResponse>(`/orders/${id}`);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  },
  createOrder: (orderData: {
    items: Array<{
      product: string;
      variant: { color: string; size: string; sku: string };
      quantity: number;
      price: number;
    }>;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'upi' | 'net_banking' | 'wallet';
    phone: string;
    notes?: string;
  }) => apiUtils.post<{
    message: string;
    order: Order;
    paymentRequest: any;
    paymentUrl: string;
  }>('/orders', orderData),
  updateOrderStatus: (id: string, data: { status: string; notes?: string }) =>
    apiUtils.put<{
      message: string;
      order: Order;
    }>(`/orders/${id}/status`, data),
  cancelOrder: (id: string) => apiUtils.put<{
    message: string;
    order: Order;
  }>(`/orders/${id}/cancel`, {}),
  handlePaymentResponse: (paymentData: any) => apiUtils.post<{
    success: boolean;
    orderId: string;
    order?: Order;
    message: string;
  }>('/orders/payment/callback', paymentData),
};

// Export all APIs as a single object
export const api = {
  auth: authApi,
  collections: collectionsApi,
  products: productsApi,
  orders: ordersApi,
  async get<T>(path: string) {
    return apiUtils.get<T>(`${path}`);
  },
  async post<T>(path: string, body: unknown) {
    return apiUtils.post<T>(`${path}`, body);
  },
  async put<T>(path: string, body: unknown) {
    return apiUtils.put<T>(`${path}`, body);
  },
  async delete<T>(path: string) {
    return apiUtils.delete<T>(`${path}`);
  }
};
