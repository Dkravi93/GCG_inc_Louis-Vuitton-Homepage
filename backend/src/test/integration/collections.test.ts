import request from 'supertest';
import app from '../../setup/app';
import {
    createTestUser,
    createTestAdmin,
    createTestCollection,
    createTestProduct,
    mockCollection,
} from '../utils/testHelpers';

describe('Collections API Integration Tests', () => {
    let adminUser: any;
    let regularUser: any;

    beforeEach(async () => {
        adminUser = await createTestAdmin();
        regularUser = await createTestUser();
    });

    describe('GET /api/collections', () => {
        it('should return all collections', async () => {
            await createTestCollection({}, adminUser.id);
            await createTestCollection({ name: 'Winter Collection' }, adminUser.id);

            const res = await request(app).get('/api/collections');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
        });

        it('should populate products in collections', async () => {
            const product = await createTestProduct();
            await createTestCollection({ products: [product._id] }, adminUser.id);

            const res = await request(app).get('/api/collections');

            expect(res.statusCode).toBe(200);
            expect(res.body[0].products).toBeDefined();
            expect(res.body[0].products[0]).toHaveProperty('name');
        });

        it('should return empty array when no collections exist', async () => {
            const res = await request(app).get('/api/collections');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe('GET /api/collections/:id', () => {
        it('should return a collection by ID', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app).get(`/api/collections/${collection._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe(collection.name);
            expect(res.body.description).toBe(collection.description);
        });

        it('should return 404 for non-existent collection', async () => {
            const res = await request(app).get('/api/collections/507f1f77bcf86cd799439011');

            expect(res.statusCode).toBe(404);
        });

        it('should populate products in the collection', async () => {
            const product = await createTestProduct();
            const collection = await createTestCollection({ products: [product._id] }, adminUser.id);

            const res = await request(app).get(`/api/collections/${collection._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.products).toHaveLength(1);
            expect(res.body.products[0].name).toBe(product.name);
        });
    });

    describe('POST /api/collections', () => {
        it('should create a new collection as admin', async () => {
            const res = await request(app)
                .post('/api/collections')
                .set('Cookie', [`token=${adminUser.token}`])
                .send(mockCollection);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.name).toBe(mockCollection.name);
            expect(res.body.description).toBe(mockCollection.description);
        });

        it('should fail to create collection without authentication', async () => {
            const res = await request(app)
                .post('/api/collections')
                .send(mockCollection);

            expect(res.statusCode).toBe(401);
        });

        it('should fail to create collection as regular user', async () => {
            const res = await request(app)
                .post('/api/collections')
                .set('Cookie', [`token=${regularUser.token}`])
                .send(mockCollection);

            expect(res.statusCode).toBe(403);
        });

        it('should create collection with empty products array', async () => {
            const res = await request(app)
                .post('/api/collections')
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ ...mockCollection, products: [] });

            expect(res.statusCode).toBe(201);
            expect(res.body.products).toEqual([]);
        });
    });

    describe('PUT /api/collections/:id', () => {
        it('should update a collection as admin', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app)
                .put(`/api/collections/${collection._id}`)
                .set('Cookie', [`token=${adminUser.token}`])
                .send({
                    name: 'Updated Collection',
                    description: 'Updated description',
                    isActive: false,
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Updated Collection');
            expect(res.body.description).toBe('Updated description');
            expect(res.body.isActive).toBe(false);
        });

        it('should fail to update collection without authentication', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app)
                .put(`/api/collections/${collection._id}`)
                .send({ name: 'Updated' });

            expect(res.statusCode).toBe(401);
        });

        it('should fail to update collection as regular user', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app)
                .put(`/api/collections/${collection._id}`)
                .set('Cookie', [`token=${regularUser.token}`])
                .send({ name: 'Updated' });

            expect(res.statusCode).toBe(403);
        });

        it('should return 404 for non-existent collection', async () => {
            const res = await request(app)
                .put('/api/collections/507f1f77bcf86cd799439011')
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ name: 'Updated' });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/collections/:id', () => {
        it('should delete a collection as admin', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app)
                .delete(`/api/collections/${collection._id}`)
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(204);
        });

        it('should fail to delete collection without authentication', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app).delete(`/api/collections/${collection._id}`);

            expect(res.statusCode).toBe(401);
        });

        it('should fail to delete collection as regular user', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app)
                .delete(`/api/collections/${collection._id}`)
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(403);
        });

        it('should return 404 for non-existent collection', async () => {
            const res = await request(app)
                .delete('/api/collections/507f1f77bcf86cd799439011')
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /api/collections/:id/products', () => {
        it('should add a product to collection as admin', async () => {
            const collection = await createTestCollection({}, adminUser.id);
            const product = await createTestProduct();

            const res = await request(app)
                .post(`/api/collections/${collection._id}/products`)
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ productId: product._id.toString() });

            expect(res.statusCode).toBe(200);
            expect(res.body.products).toHaveLength(1);
        });

        it('should not add duplicate products', async () => {
            const product = await createTestProduct();
            const collection = await createTestCollection({ products: [product._id] }, adminUser.id);

            const res = await request(app)
                .post(`/api/collections/${collection._id}/products`)
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ productId: product._id.toString() });

            expect(res.statusCode).toBe(200);
            expect(res.body.products).toHaveLength(1); // Still only one
        });

        it('should return 404 for non-existent product', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app)
                .post(`/api/collections/${collection._id}/products`)
                .set('Cookie', [`token=${adminUser.token}`])
                .send({ productId: '507f1f77bcf86cd799439011' });

            expect(res.statusCode).toBe(404);
        });

        it('should fail without authentication', async () => {
            const collection = await createTestCollection({}, adminUser.id);
            const product = await createTestProduct();

            const res = await request(app)
                .post(`/api/collections/${collection._id}/products`)
                .send({ productId: product._id.toString() });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('DELETE /api/collections/:id/products/:productId', () => {
        it('should remove a product from collection as admin', async () => {
            const product = await createTestProduct();
            const collection = await createTestCollection({ products: [product._id] }, adminUser.id);

            const res = await request(app)
                .delete(`/api/collections/${collection._id}/products/${product._id}`)
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.products).toHaveLength(0);
        });

        it('should handle removing non-existent product gracefully', async () => {
            const collection = await createTestCollection({}, adminUser.id);

            const res = await request(app)
                .delete(`/api/collections/${collection._id}/products/507f1f77bcf86cd799439011`)
                .set('Cookie', [`token=${adminUser.token}`]);

            expect(res.statusCode).toBe(200);
            expect(res.body.products).toHaveLength(0);
        });

        it('should fail without authentication', async () => {
            const product = await createTestProduct();
            const collection = await createTestCollection({ products: [product._id] }, adminUser.id);

            const res = await request(app)
                .delete(`/api/collections/${collection._id}/products/${product._id}`);

            expect(res.statusCode).toBe(401);
        });

        it('should fail as regular user', async () => {
            const product = await createTestProduct();
            const collection = await createTestCollection({ products: [product._id] }, adminUser.id);

            const res = await request(app)
                .delete(`/api/collections/${collection._id}/products/${product._id}`)
                .set('Cookie', [`token=${regularUser.token}`]);

            expect(res.statusCode).toBe(403);
        });
    });
});
