import { Router } from 'express';
import { reportError, getErrorStats } from '../controllers/errors';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public route for error reporting (no auth required)
router.post('/', reportError);

// Protected route for error statistics (admin only)
router.get('/stats', requireAuth, getErrorStats);

export default router;
