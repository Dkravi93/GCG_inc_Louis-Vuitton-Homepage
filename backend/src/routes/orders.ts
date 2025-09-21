import { Router } from 'express';
import { 
  getOrders, 
  getOrderById, 
  createOrder, 
  updateOrderStatus, 
  cancelOrder, 
  handlePaymentResponse 
} from '../controllers/orders';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes (for PayU callbacks)
router.post('/payment/callback', handlePaymentResponse);
router.post('/payment/webhook', handlePaymentResponse);

// Protected routes (require authentication)
router.use(requireAuth);

// Get all orders (user gets their orders, admin gets all orders)
router.get('/', getOrders);

// Create new order
router.post('/', createOrder);

// Get specific order by ID
router.get('/:id', getOrderById);

// Update order status (admin only)
router.patch('/:id/status', updateOrderStatus);

// Cancel order
router.patch('/:id/cancel', cancelOrder);

export default router;