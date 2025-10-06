    import { Request, Response } from 'express';
    import { z } from 'zod';
    import { UserModel } from '../models/user';
    import { hashPassword, signToken, verifyPassword } from '../utils/auth';
    import { AuthenticatedRequest } from '../types/express';
    import { emailService } from '../services/emailService';

    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      role: z.enum(['user', 'admin', 'superadmin']).optional(),
    });

    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    export async function register(req: Request, res: Response) {
      const parse = registerSchema.safeParse(req.body);
      if (!parse.success) return res.status(400).json({ message: 'Invalid data' });
      const { email, password, firstName, lastName, role } = parse.data;

      const existing = await UserModel.findOne({ email }).lean();
      if (existing) return res.status(409).json({ message: 'Email already in use' });

      const passwordHash = await hashPassword(password);
      const user = await UserModel.create({ email, passwordHash, firstName, lastName, role });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email, `${firstName} ${lastName}`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Optionally you can continue even if email fails, or you can return an error
        // But usually you don’t want registration to fail just because email sending fails
      }

      const token = signToken({ sub: user.id, email: user.email, role: user.role });
      return res.status(201).json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName, 
          lastName, 
          role: user.role, 
          avatarUrl: user.avatarUrl, 
          preferences: user.preferences 
        } 
      });
    }

    export async function login(req: Request, res: Response) {
      const parse = loginSchema.safeParse(req.body);
      if (!parse.success) return res.status(400).json({ message: 'Invalid credentials' });
      const { email, password } = parse.data;
      const user = await UserModel.findOne({ email });

      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      const token = signToken({ sub: user.id, email: user.email, role: user.role });
      return res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatarUrl: user.avatarUrl, preferences: user.preferences } });
    }

    export async function me(req: Request, res: Response) {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) return res.status(401).json({ message: 'Unauthorized' });
      const user = await UserModel.findById(authenticatedReq.user.sub).lean();
      if (!user) return res.status(404).json({ message: 'Not found' });
      return res.json({ user: { id: String(user._id), email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatarUrl: user.avatarUrl, preferences: user.preferences } });
    }

    const updateProfileSchema = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional()
    });

    const updatePreferencesSchema = z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      locale: z.string().optional()
    });

    export async function updateMe(req: Request, res: Response) {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) return res.status(401).json({ message: 'Unauthorized' });

      const parse = updateProfileSchema.safeParse(req.body);
      if (!parse.success) return res.status(400).json({ message: 'Invalid data' });

      try {
        const updated = await UserModel.findByIdAndUpdate(
          authenticatedReq.user.sub,
          { $set: parse.data },
          { new: true }
        ).lean();

        if (!updated) return res.status(404).json({ message: 'User not found' });
        
        const token = signToken({ sub: String(updated._id), email: updated.email, role: updated.role });
        return res.json({ 
          token,
          user: { 
            id: String(updated._id), 
            email: updated.email, 
            firstName: updated.firstName, 
            lastName: updated.lastName, 
            role: updated.role, 
            avatarUrl: updated.avatarUrl, 
            preferences: updated.preferences 
          } 
        });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to update profile' });
      }
    }

    export async function updatePreferences(req: Request, res: Response) {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) return res.status(401).json({ message: 'Unauthorized' });

      const parse = updatePreferencesSchema.safeParse(req.body);
      if (!parse.success) return res.status(400).json({ message: 'Invalid data' });

      try {
        const updated = await UserModel.findByIdAndUpdate(
          authenticatedReq.user.sub,
          { $set: { preferences: parse.data } },
          { new: true }
        ).lean();
        if (!updated) return res.status(404).json({ message: 'User not found' });
        
        const token = signToken({ sub: String(updated._id), email: updated.email, role: updated.role });
        return res.json({ 
          token,
          user: { 
            id: String(updated._id), 
            email: updated.email, 
            firstName: updated.firstName, 
            lastName: updated.lastName, 
            role: updated.role, 
            avatarUrl: updated.avatarUrl, 
            preferences: updated.preferences 
          } 
        });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to update preferences' });
      }
    }

    export async function updateAvatar(req: Request, res: Response) {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) return res.status(401).json({ message: 'Unauthorized' });
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      try {
        const updated = await UserModel.findByIdAndUpdate(
          authenticatedReq.user.sub,
          { $set: { avatarUrl } },
          { new: true }
        ).lean();

        if (!updated) return res.status(404).json({ message: 'User not found' });
        
        const token = signToken({ sub: String(updated._id), email: updated.email, role: updated.role });
        return res.json({ 
          token,
          user: { 
            id: String(updated._id), 
            email: updated.email, 
            firstName: updated.firstName, 
            lastName: updated.lastName, 
            role: updated.role, 
            avatarUrl: updated.avatarUrl, 
            preferences: updated.preferences 
          } 
        });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to update avatar' });
      }
    }


