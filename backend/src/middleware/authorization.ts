import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { AppError } from '../utils/appError';

export const requireRole = <
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
>(...roles: string[]): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, _res: Response<ResBody>, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized', 403));
    }

    next();
  };
};

export const requireOwnership = (paramName: string = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.params[paramName] !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    next();
  };
};