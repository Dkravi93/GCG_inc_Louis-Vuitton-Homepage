import { Request, Response, CookieOptions } from 'express';
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

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  locale: z.string().optional()
});

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

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
  }

  const token = signToken({ sub: user._id.toString(), email: user.email, role: user.role });

  res.cookie('token', token, COOKIE_OPTIONS);

  return res.status(201).json({
    // Token is in cookie, optional to return in body too, but best practice is NOT to if we are fully cookie based. 
    // We will return it for now for backward compatibility if needed, but the user asked for "good practice", so we will OMIT it?
    // Let's omit it to force cookie usage, or keep it? User said "don't store in localstorage".
    // Use cookie.
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName,
      lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
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

  const token = signToken({ sub: user._id.toString(), email: user.email, role: user.role });

  res.cookie('token', token, COOKIE_OPTIONS);

  return res.json({
    user: { id: user._id.toString(), email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatarUrl: user.avatarUrl, createdAt: user.createdAt, preferences: user.preferences }
  });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.json({ message: 'Logged out successfully' });
}

export async function me(req: Request, res: Response) {
  const authenticatedReq = req as AuthenticatedRequest;
  if (!authenticatedReq.user) return res.status(401).json({ message: 'Unauthorized' });
  const user = await UserModel.findById(authenticatedReq.user.sub).lean();
  if (!user) return res.status(404).json({ message: 'Not found' });
  return res.json({
    user: {
      id: String(user._id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      preferences: user.preferences
    }
  });
}

// ... helper to update cookie on profile update ...

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
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      user: {
        id: String(updated._id),
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
        createdAt: updated.createdAt,
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
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      user: {
        id: String(updated._id),
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
        createdAt: updated.createdAt,
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
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      user: {
        id: String(updated._id),
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
        createdAt: updated.createdAt,
        preferences: updated.preferences
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update avatar' });
  }
}
