import { UserModel } from '../../models/user';
import { ProductModel } from '../../models/product';
import { Collection } from '../../models/collection';
import { Order, IOrder } from '../../models/order';
import { hashPassword, signToken } from '../../utils/auth';

export interface TestUser {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin' | 'superadmin';
    token: string;
}

export async function createTestUser(data?: Partial<TestUser>): Promise<TestUser> {
    const email = data?.email || `test${Date.now()}@example.com`;
    const password = data?.password || 'password123';
    const firstName = data?.firstName || 'Test';
    const lastName = data?.lastName || 'User';
    const role = data?.role || 'user';

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
        email,
        passwordHash,
        firstName,
        lastName,
        role,
    });

    const token = signToken({ sub: user._id.toString(), email: user.email, role: user.role });

    return {
        id: user._id.toString(),
        email: user.email,
        password,
        firstName,
        lastName,
        role: user.role,
        token,
    };
}

export async function createTestAdmin(): Promise<TestUser> {
    return createTestUser({ role: 'admin', email: 'admin@example.com' });
}

export async function createTestSuperAdmin(): Promise<TestUser> {
    return createTestUser({ role: 'superadmin', email: 'superadmin@example.com' });
}

export const mockProduct = {
    name: 'Test Sunglasses',
    basePrice: 15000,
    brand: 'Louis Vuitton',
    category: 'Sunglasses',
    material: 'Acetate',
    gender: 'unisex' as const,
    style: 'Aviator',
    color: 'Black',
    featured: true,
    onSale: false,
    limitedEdition: false,
    hidden: false,
    tags: ['premium', 'luxury'],
    variants: [
        {
            sku: 'LV-SUN-001',
            color: 'Black',
            size: 'Medium',
            stock: 10,
            price: 15000,
        },
    ],
    images: [
        {
            url: 'https://example.com/image1.jpg',
            alt: 'Test sunglasses front view',
            isPrimary: true,
        },
    ],
    description: 'Premium luxury sunglasses',
};

let skuCounter = 0;
export async function createTestProduct(data?: Partial<typeof mockProduct>) {
    const uniqueSku = `SKU-${Date.now()}-${skuCounter++}-${Math.random().toString(36).substring(7)}`;

    const productData = {
        ...mockProduct,
        ...data,
        variants: data?.variants || [
            {
                ...mockProduct.variants[0],
                sku: uniqueSku,
            },
        ],
    };

    return ProductModel.create(productData);
}

export const mockCollection = {
    name: 'Summer Collection',
    description: 'Best summer eyewear',
    image: 'https://example.com/collection.jpg',
    banner: 'https://example.com/banner.jpg',
    isActive: true,
    isFeatured: true,
    products: [] as any[],
};

export async function createTestCollection(data?: Partial<typeof mockCollection>, userId?: string) {
    return Collection.create({ ...mockCollection, ...data, createdBy: userId });
}

export const mockOrder = {
    items: [
        {
            product: '', // To be filled with actual product ID
            variant: {
                color: 'Black',
                size: 'Medium',
                sku: 'LV-SUN-001',
            },
            quantity: 2,
            price: 15000,
        },
    ],
    shippingAddress: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
    },
    billingAddress: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
    },
    payment: {
        method: 'credit_card' as const,
        status: 'pending' as const,
        gateway: 'payu',
    },
    subtotal: 30000,
    tax: 2400,
    shippingCost: 0,
    total: 32400,
};

export async function createTestOrder(userId: string, productId: string, data?: any) {
    const orderData: any = {
        ...mockOrder,
        ...data,
        user: userId,
        items: [
            {
                ...mockOrder.items[0],
                product: productId,
            },
        ],
    };
    return Order.create(orderData);
}
