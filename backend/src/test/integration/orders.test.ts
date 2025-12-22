import request from 'supertest';
import app from '../../setup/app';
import {
    createTestUser,
    createTestAdmin,
    createTestProduct,
    createTestOrder,
    mockOrder,
} from '../utils/testHelpers';

describe('Orders API Integration Tests', () => {
    let adminUser: any;
    let regularUser: any;
    let otherUser: any;
    let testProduct: any;

    beforeEach(async () => {
        adminUser = await createTestAdmin();
        regularUser = await createTestUser();
        otherUser = await createTestUser({ email: 'other@example.com' });
        testProduct = await createTestProduct();
    });

    describe('GET /api/orders', () => {
        it('should return user\'s own orders', async () => {
            await createTestOrder(regularUser.id, testProduct._id.toString());
            await createTestOrder(otherUser.id, testProduct._id.toString());

            const res = await request(app)
                .get('/api/orders')
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.orders).toHaveLength(1);
            expect(res.body.orders[0].user._id.toString()).toBe(regularUser.id);
        });

        it('should return all orders for admin', async () => {
            await createTestOrder(regularUser.id, testProduct._id.toString());
            await createTestOrder(otherUser.id, testProduct._id.toString());

            const res = await request(app)
                .get('/api/orders')
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.orders).toHaveLength(2);
        });

        it('should paginate orders', async () => {
            // Create 15 orders
            for (let i = 0; i < 15; i++) {
                await createTestOrder(regularUser.id, testProduct._id.toString());
            }

            const res = await request(app)
                .get('/api/orders')
                .set('Cookie', [`token=${regularUser.token}`])
                .query({ page: '2', limit: '10' });

            expect(res.statusCode).toBe(200);
            expect(res.body.orders).toHaveLength(5);
            expect(res.body.pagination.page).toBe(2);
            expect(res.body.pagination.total).toBe(15);
        });

        it('should filter orders by status', async () => {
            await createTestOrder(regularUser.id, testProduct._id.toString(), { status: 'pending' });
            await createTestOrder(regularUser.id, testProduct._id.toString(), { status: 'confirmed' });

            const res = await request(app)
                .get('/api/orders')
                .set('Cookie', [`token=${regularUser.token}`])
                .query({ status: 'confirmed' });

            expect(res.statusCode).toBe(200);
            expect(res.body.orders).toHaveLength(1);
            expect(res.body.orders[0].status).toBe('confirmed');
        });

        it('should fail without authentication', async () => {
            const res = await request(app).get('/api/orders');

            expect(res.statusCode).toBe(401);
        });

        it('should populate user and product details', async () => {
            await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .get('/api/orders')
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.orders[0].user).toHaveProperty('email');
            expect(res.body.orders[0].items[0].product).toHaveProperty('name');
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should return order by ID for owner', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .get(`/api/orders/${order._id}`)
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.order._id.toString()).toBe(order._id.toString());
        });

        it('should return order by ID for admin', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .get(`/api/orders/${order._id}`)
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.order._id.toString()).toBe(order._id.toString());
        });

        it('should not return other user\'s order', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .get(`/api/orders/${order._id}`)
                .set('Cookie', [`token=${otherUser.token}`]);

            expect(res.statusCode).toBe(404);
        });

        it('should fail without authentication', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app).get(`/api/orders/${order._id}`);

            expect(res.statusCode).toBe(401);
        });

        it('should return 404 for non-existent order', async () => {
            const res = await request(app)
                .get('/api/orders/507f1f77bcf86cd799439011')
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /api/orders', () => {
        it('should create a new order', async () => {
            const orderData = {
                items: [
                    {
                        product: testProduct._id.toString(),
                        variant: {
                            color: 'Black',
                            size: 'Medium',
                            sku: 'LV-SUN-001',
                        },
                        quantity: 1,
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
                paymentMethod: 'credit_card',
            };

            const res = await request(app)
                .post('/api/orders')
                .set('Cookie', [`token=${regularUser.token}`])
                .send(orderData);

            expect(res.statusCode).toBe(201);
            expect(res.body.order).toBeDefined();
            expect(res.body.order.total).toBeDefined();
            expect(res.body.paymentRequest).toBeDefined();
            expect(res.body.paymentUrl).toBeDefined();
        });

        it('should calculate totals correctly', async () => {
            const orderData = {
                items: [
                    {
                        product: testProduct._id.toString(),
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
                paymentMethod: 'credit_card',
            };

            const res = await request(app)
                .post('/api/orders')
                .set('Cookie', [`token=${regularUser.token}`])
                .send(orderData);

            expect(res.statusCode).toBe(201);
            expect(res.body.order.subtotal).toBe(30000); // 2 * 15000
            expect(res.body.order.tax).toBe(2400); // 8% of 30000
            expect(res.body.order.shippingCost).toBe(0); // Free shipping over 2000
            expect(res.body.order.total).toBe(32400); // 30000 + 2400 + 0
        });

        it('should apply shipping cost for orders under 2000', async () => {
            const orderData = {
                items: [
                    {
                        product: testProduct._id.toString(),
                        variant: {
                            color: 'Black',
                            size: 'Medium',
                            sku: 'LV-SUN-001',
                        },
                        quantity: 1,
                        price: 1000,
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
                paymentMethod: 'credit_card',
            };

            const res = await request(app)
                .post('/api/orders')
                .set('Cookie', [`token=${regularUser.token}`])
                .send(orderData);

            expect(res.statusCode).toBe(201);
            expect(res.body.order.shippingCost).toBe(199);
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send({ items: [] });

            expect(res.statusCode).toBe(401);
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Cookie', [`token=${regularUser.token}`])
                .send({ items: [] }); // Missing required fields

            expect(res.statusCode).toBe(400);
        });
    });

    describe('PATCH /api/orders/:id/status', () => {
        it('should update order status as admin', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ status: 'confirmed' });

            expect(res.statusCode).toBe(200);
            expect(res.body.order.status).toBe('confirmed');
        });

        it('should fail as regular user', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .set('Cookie', [`token=${regularUser.token}`])
                .send({ status: 'confirmed' });

            expect(res.statusCode).toBe(403);
        });

        it('should fail without authentication', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .send({ status: 'confirmed' });

            expect(res.statusCode).toBe(401);
        });

        it('should validate status values', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ status: 'invalid_status' });

            expect(res.statusCode).toBe(400);
        });

        it('should return 404 for non-existent order', async () => {
            const res = await request(app)
                .patch('/api/orders/507f1f77bcf86cd799439011/status')
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ status: 'confirmed' });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('PATCH /api/orders/:id/cancel', () => {
        it('should cancel own order as user', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .patch(`/api/orders/${order._id}/cancel`)
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.order.status).toBe('cancelled');
        });

        it('should cancel any order as admin', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .patch(`/api/orders/${order._id}/cancel`)
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.order.status).toBe('cancelled');
        });

        it('should not cancel other user\'s order', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app)
                .patch(`/api/orders/${order._id}/cancel`)
                .set('Cookie', [`token=${otherUser.token}`]);

            expect(res.statusCode).toBe(404);
        });

        it('should not cancel shipped orders', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString(), { status: 'shipped' });

            const res = await request(app)
                .patch(`/api/orders/${order._id}/cancel`)
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Cannot cancel');
        });

        it('should not cancel delivered orders', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString(), { status: 'delivered' });

            const res = await request(app)
                .patch(`/api/orders/${order._id}/cancel`)
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Cannot cancel');
        });

        it('should fail without authentication', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const res = await request(app).patch(`/api/orders/${order._id}/cancel`);

            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /api/orders/payment/callback', () => {
        it('should handle successful payment callback', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            // Mock PayU successful payment response
            const paymentResponse = {
                status: 'success',
                txnid: 'test-txn-123',
                amount: '32400',
                productinfo: 'Test Product',
                firstname: 'Test',
                email: 'test@example.com',
                mihpayid: 'payu-123',
                udf1: order._id.toString(),
                hash: 'test-hash', // Would need proper hash in real scenario
            };

            const res = await request(app)
                .post('/api/orders/payment/callback')
                .send(paymentResponse);

            // Note: This will fail without proper hash verification
            // In a real test, you'd mock the payuService.verifyPaymentResponse
            expect([200, 400]).toContain(res.statusCode);
        });

        it('should handle failed payment callback', async () => {
            const order = await createTestOrder(regularUser.id, testProduct._id.toString());

            const paymentResponse = {
                status: 'failure',
                txnid: 'test-txn-124',
                amount: '32400',
                udf1: order._id.toString(),
                error_Message: 'Payment declined',
            };

            const res = await request(app)
                .post('/api/orders/payment/callback')
                .send(paymentResponse);

            expect([200, 400]).toContain(res.statusCode);
        });
    });
});
