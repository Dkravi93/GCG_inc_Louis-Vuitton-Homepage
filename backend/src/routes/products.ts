    import { Router } from 'express';
    import { getAllProducts, getProductById, searchProducts, createProduct, deleteProduct, updateProduct } from '../controllers/products';
    import { requireAuth, requireRole } from '../middleware/auth';

    const router = Router();

    router.get('/', getAllProducts);
    router.get('/search', searchProducts);
    router.post('/', requireAuth, requireRole(['admin', 'superadmin']), createProduct);
    router.put('/:id', requireAuth, requireRole(['admin', 'superadmin']), updateProduct);
    router.get('/:id', getProductById);
    router.delete('/:id', requireAuth, requireRole(['admin', 'superadmin']), deleteProduct);

    export default router;


