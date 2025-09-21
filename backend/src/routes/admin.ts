    import { Router } from 'express';
    import { requireAuth, requireRole } from '../middleware/auth';

    const router = Router();
    router.use(requireAuth, requireRole(['admin', 'superadmin']));

    router.get('/dashboard', (_req, res) => {
      return res.json({ stats: { users: 0, orders: 0, revenue: 0 } });
    });

    export default router;


