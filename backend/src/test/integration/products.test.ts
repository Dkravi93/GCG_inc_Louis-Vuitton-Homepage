import request from 'supertest';
import app from '../../setup/app';
import {
    createTestUser,
    createTestAdmin,
    createTestProduct,
    mockProduct,
} from '../utils/testHelpers';

describe('Products API Integration Tests', () => {
    let adminUser: any;
    let regularUser: any;

    beforeEach(async () => {
        adminUser = await createTestAdmin();
        regularUser = await createTestUser();
    });

    describe('GET /api/products', () => {
        it('should return all products', async () => {
            // Create test products
            await createTestProduct();
            await createTestProduct({ name: 'Another Product' });

            const res = await request(app).get('/api/products');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('items');
            expect(res.body.items).toHaveLength(2);
            expect(res.body).toHaveProperty('total', 2);
        });

        it('should filter products by category', async () => {
            await createTestProduct({ category: 'Sunglasses' });
            await createTestProduct({ category: 'Eyeglasses' });

            const res = await request(app)
                .get('/api/products')
                .query({ category: 'Sunglasses' });

            expect(res.statusCode).toBe(200);
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].category).toBe('Sunglasses');
        });

        it('should filter products by featured flag', async () => {
            await createTestProduct({ featured: true });
            await createTestProduct({ featured: false });

            const res = await request(app)
                .get('/api/products')
                .query({ featured: 'true' });

            expect(res.statusCode).toBe(200);
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].featured).toBe(true);
        });

        it('should paginate results', async () => {
            // Create 15 products
            for (let i = 0; i < 15; i++) {
                await createTestProduct({ name: `Product ${i}` });
            }

            const res = await request(app)
                .get('/api/products')
                .query({ page: '2', pageSize: '10' });

            expect(res.statusCode).toBe(200);
            expect(res.body.items).toHaveLength(5);
            expect(res.body.page).toBe(2);
            expect(res.body.total).toBe(15);
        });

        it('should sort products by price ascending', async () => {
            await createTestProduct({ basePrice: 15000 });
            await createTestProduct({ basePrice: 10000 });
            await createTestProduct({ basePrice: 20000 });

            const res = await request(app)
                .get('/api/products')
                .query({ sort: 'price_asc' });

            expect(res.statusCode).toBe(200);
            expect(res.body.items[0].basePrice).toBe(10000);
            expect(res.body.items[2].basePrice).toBe(20000);
        });

        it('should not return hidden products', async () => {
            await createTestProduct({ hidden: false });
            await createTestProduct({ hidden: true });

            const res = await request(app).get('/api/products');

            expect(res.statusCode).toBe(200);
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].hidden).toBeFalsy();
        });
    });

    describe('GET /api/products/search', () => {
        it('should search products by name', async () => {
            await createTestProduct({ name: 'Aviator Sunglasses' });
            await createTestProduct({ name: 'Round Eyeglasses' });

            const res = await request(app)
                .get('/api/products/search')
                .query({ q: 'Aviator' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toContain('Aviator');
        });

        it('should return empty array for no query', async () => {
            const res = await request(app).get('/api/products/search');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('should limit search results to 10', async () => {
            for (let i = 0; i < 15; i++) {
                await createTestProduct({ name: `Test Product ${i}` });
            }

            const res = await request(app)
                .get('/api/products/search')
                .query({ q: 'Test' });

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBeLessThanOrEqual(10);
        });
    });

    describe('GET /api/products/:id', () => {
        it('should return a product by ID', async () => {
            const product = await createTestProduct();

            const res = await request(app).get(`/api/products/${product._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe(product.name);
            expect(res.body.basePrice).toBe(product.basePrice);
        });

        it('should return 404 for non-existent product', async () => {
            const res = await request(app).get('/api/products/507f1f77bcf86cd799439011');

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('message', 'Not found');
        });

        it('should return 500 for invalid product ID format', async () => {
            const res = await request(app).get('/api/products/invalid-id');

            expect(res.statusCode).toBe(500);
        });
    });

    describe('POST /api/products', () => {
        it('should create a new product as admin', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Cookie', [`token=${adminUser.token}`])
                .send(mockProduct);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.name).toBe(mockProduct.name);
            expect(res.body.basePrice).toBe(mockProduct.basePrice);
        });

        it('should fail to create product without authentication', async () => {
            const res = await request(app)
                .post('/api/products')
                .send(mockProduct);

            expect(res.statusCode).toBe(401);
        });

        it('should fail to create product as regular user', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Cookie', [`token=${regularUser.token}`])
                .send(mockProduct);

            expect(res.statusCode).toBe(403);
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ name: 'Test' }); // Missing required fields

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'Invalid product data');
        });

        it('should validate basePrice is non-negative', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ ...mockProduct, basePrice: -100 });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update a product as admin', async () => {
            const product = await createTestProduct();

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ name: 'Updated Product', basePrice: 20000 });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe('Updated Product');
            expect(res.body.data.basePrice).toBe(20000);
        });

        it('should fail to update product without authentication', async () => {
            const product = await createTestProduct();

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .send({ name: 'Updated Product' });

            expect(res.statusCode).toBe(401);
        });

        it('should fail to update product as regular user', async () => {
            const product = await createTestProduct();

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Cookie', [`token=${regularUser.token}`])
                .send({ name: 'Updated Product' });

            expect(res.statusCode).toBe(403);
        });

        it('should return 404 for non-existent product', async () => {
            const res = await request(app)
                .put('/api/products/507f1f77bcf86cd799439011')
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ name: 'Updated Product' });

            expect(res.statusCode).toBe(404);
        });

        it('should allow partial updates', async () => {
            const product = await createTestProduct();

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ featured: false });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.featured).toBe(false);
            expect(res.body.data.name).toBe(product.name); // Other fields unchanged
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete a product as admin', async () => {
            const product = await createTestProduct();

            const res = await request(app)
                .delete(`/api/products/${product._id}`)
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(204);
        });

        it('should fail to delete product without authentication', async () => {
            const product = await createTestProduct();

            const res = await request(app).delete(`/api/products/${product._id}`);

            expect(res.statusCode).toBe(401);
        });

        it('should fail to delete product as regular user', async () => {
            const product = await createTestProduct();

            const res = await request(app)
                .delete(`/api/products/${product._id}`)
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(403);
        });

        it('should return 404 for non-existent product', async () => {
            const res = await request(app)
                .delete('/api/products/507f1f77bcf86cd799439011')
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(404);
        });
    });
});
