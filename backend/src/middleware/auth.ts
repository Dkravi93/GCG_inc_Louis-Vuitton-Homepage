import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { Document } from 'mongoose';
import { AuthenticatedRequest as BaseAuthenticatedRequest, AuthUser } from '../types/express';

export type AuthenticatedRequest<
  P = {},
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> = BaseAuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>;

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const token = header.slice('Bearer '.length);
  try {
    const authReq = req as AuthenticatedRequest;
    authReq.user = verifyToken(token) as AuthUser & Document;
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requireRole(roles: ('user' | 'admin' | 'superadmin')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    if (!authReq.user.role || !roles.includes(authReq.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}
