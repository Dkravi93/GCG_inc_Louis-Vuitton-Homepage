// Request parameter types for Collections endpoints
export interface CollectionParams {
  id?: string;
  productId?: string;
}

export interface CollectionQuery {
  limit?: number;
  page?: number;
  sort?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

// Response types
export interface CollectionResponse {
  id: string;
  name: string;
  description: string;
  image?: string;
  banner?: string;
  isActive: boolean;
  isFeatured: boolean;
  products: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Request body types
export interface CreateCollectionBody {
  name: string;
  description: string;
  image?: string;
  banner?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateCollectionBody {
  name?: string;
  description?: string;
  image?: string;
  banner?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface AddProductBody {
  productId: string;
}