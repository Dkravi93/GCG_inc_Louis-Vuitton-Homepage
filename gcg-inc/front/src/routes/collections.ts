import { Router } from 'express';
import { 
  getAllCollections, 
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection
} from '../controllers/collections';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllCollections);
router.get('/:id', getCollectionById);

// Admin only routes
router.use(requireAuth, requireRole('admin'));
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);
router.post('/:id/products', addProductToCollection);
router.delete('/:id/products/:productId', removeProductFromCollection);

export default router;
