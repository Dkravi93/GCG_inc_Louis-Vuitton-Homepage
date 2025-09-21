import { Document } from 'mongoose';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

interface AuthUser {
  sub: string;  // JWT standard for subject (user ID)
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin' | 'superadmin';
  iat?: number;  // Issued at
  exp?: number;  // Expiration
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser & Document;
    }
  }
}

export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: AuthUser & Document;
}