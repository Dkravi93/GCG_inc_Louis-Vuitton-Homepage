import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GCG Inventory API',
            version: version,
            description: 'Complete API documentation for the GCG Inventory application - an e-commerce platform for luxury eyewear',
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development server',
            },
            {
                url: 'https://api.gcginventory.com/api',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer {token}',
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'User ID',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        firstName: {
                            type: 'string',
                            description: 'First name',
                        },
                        lastName: {
                            type: 'string',
                            description: 'Last name',
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'admin', 'superadmin'],
                            description: 'User role',
                        },
                        avatarUrl: {
                            type: 'string',
                            description: 'Profile picture URL',
                        },
                        preferences: {
                            type: 'object',
                            properties: {
                                theme: {
                                    type: 'string',
                                    enum: ['light', 'dark', 'system'],
                                },
                                locale: {
                                    type: 'string',
                                },
                            },
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Product: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Product ID',
                        },
                        name: {
                            type: 'string',
                            description: 'Product name',
                        },
                        basePrice: {
                            type: 'number',
                            description: 'Base price in INR',
                        },
                        brand: {
                            type: 'string',
                            description: 'Brand name',
                        },
                        category: {
                            type: 'string',
                            description: 'Product category',
                        },
                        material: {
                            type: 'string',
                            description: 'Material type',
                        },
                        gender: {
                            type: 'string',
                            enum: ['men', 'women', 'unisex'],
                        },
                        style: {
                            type: 'string',
                            description: 'Style type',
                        },
                        color: {
                            type: 'string',
                            description: 'Primary color',
                        },
                        featured: {
                            type: 'boolean',
                            description: 'Is featured product',
                        },
                        onSale: {
                            type: 'boolean',
                            description: 'Is on sale',
                        },
                        limitedEdition: {
                            type: 'boolean',
                            description: 'Is limited edition',
                        },
                        hidden: {
                            type: 'boolean',
                            description: 'Is hidden from listings',
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                        variants: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    sku: {
                                        type: 'string',
                                    },
                                    color: {
                                        type: 'string',
                                    },
                                    size: {
                                        type: 'string',
                                    },
                                    stock: {
                                        type: 'integer',
                                    },
                                    price: {
                                        type: 'number',
                                    },
                                },
                            },
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    url: {
                                        type: 'string',
                                    },
                                    alt: {
                                        type: 'string',
                                    },
                                    isPrimary: {
                                        type: 'boolean',
                                    },
                                },
                            },
                        },
                        description: {
                            type: 'string',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Collection: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Collection ID',
                        },
                        name: {
                            type: 'string',
                            description: 'Collection name',
                        },
                        description: {
                            type: 'string',
                            description: 'Collection description',
                        },
                        image: {
                            type: 'string',
                            description: 'Collection image URL',
                        },
                        banner: {
                            type: 'string',
                            description: 'Collection banner URL',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Is collection active',
                        },
                        isFeatured: {
                            type: 'boolean',
                            description: 'Is featured collection',
                        },
                        products: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Product',
                            },
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Order: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Order ID',
                        },
                        user: {
                            type: 'string',
                            description: 'User ID',
                        },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    product: {
                                        type: 'string',
                                        description: 'Product ID',
                                    },
                                    variant: {
                                        type: 'object',
                                        properties: {
                                            color: {
                                                type: 'string',
                                            },
                                            size: {
                                                type: 'string',
                                            },
                                            sku: {
                                                type: 'string',
                                            },
                                        },
                                    },
                                    quantity: {
                                        type: 'integer',
                                    },
                                    price: {
                                        type: 'number',
                                    },
                                },
                            },
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
                        },
                        shippingAddress: {
                            type: 'object',
                            properties: {
                                street: {
                                    type: 'string',
                                },
                                city: {
                                    type: 'string',
                                },
                                state: {
                                    type: 'string',
                                },
                                zipCode: {
                                    type: 'string',
                                },
                                country: {
                                    type: 'string',
                                },
                            },
                        },
                        billingAddress: {
                            type: 'object',
                            properties: {
                                street: {
                                    type: 'string',
                                },
                                city: {
                                    type: 'string',
                                },
                                state: {
                                    type: 'string',
                                },
                                zipCode: {
                                    type: 'string',
                                },
                                country: {
                                    type: 'string',
                                },
                            },
                        },
                        payment: {
                            type: 'object',
                            properties: {
                                method: {
                                    type: 'string',
                                    enum: ['credit_card', 'debit_card', 'paypal', 'upi', 'net_banking', 'wallet'],
                                },
                                status: {
                                    type: 'string',
                                    enum: ['pending', 'completed', 'failed', 'refunded'],
                                },
                                transactionId: {
                                    type: 'string',
                                },
                                payuPaymentId: {
                                    type: 'string',
                                },
                                payuOrderId: {
                                    type: 'string',
                                },
                                gateway: {
                                    type: 'string',
                                },
                            },
                        },
                        subtotal: {
                            type: 'number',
                            description: 'Subtotal amount',
                        },
                        tax: {
                            type: 'number',
                            description: 'Tax amount (8%)',
                        },
                        shippingCost: {
                            type: 'number',
                            description: 'Shipping cost (₹199 or free)',
                        },
                        total: {
                            type: 'number',
                            description: 'Total amount',
                        },
                        notes: {
                            type: 'string',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                            },
                            description: 'Validation errors if applicable',
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
            {
                cookieAuth: [],
            },
        ],
        tags: [
            {
                name: 'Auth',
                description: 'Authentication and user management endpoints',
            },
            {
                name: 'Products',
                description: 'Product management endpoints',
            },
            {
                name: 'Collections',
                description: 'Collection management endpoints',
            },
            {
                name: 'Orders',
                description: 'Order management and payment endpoints',
            },
            {
                name: 'Admin',
                description: 'Admin-only endpoints',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
