    import { Router } from 'express';
    import { login, register, me, updateMe, updatePreferences, updateAvatar } from '../controllers/auth';
    import { requireAuth } from '../middleware/auth';
    import { uploadAvatar } from '../middleware/upload';

    const router = Router();

    // Public routes
    router.post('/login', login);
    router.post('/register', register);

    // Protected routes
    router.get('/me', requireAuth, me);
    router.put('/me', requireAuth, updateMe);
    router.put('/me/preferences', requireAuth, updatePreferences);
    router.post('/me/avatar', requireAuth, uploadAvatar, updateAvatar);

    export default router;


