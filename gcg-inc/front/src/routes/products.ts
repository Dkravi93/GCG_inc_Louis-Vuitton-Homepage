    import { Router } from 'express';
    import { getAllProducts, getProductById, searchProducts, createProduct } from '../controllers/products';
    import { requireAuth, requireRole } from '../middleware/auth';

    const router = Router();

    router.get('/', getAllProducts);
    router.get('/search', searchProducts);
    router.post('/', requireAuth, requireRole(['admin', 'superadmin']), createProduct);
    router.get('/:id', getProductById);

    export default router;


