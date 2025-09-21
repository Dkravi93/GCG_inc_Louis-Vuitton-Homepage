import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { AppError } from './appError';
import { AuthenticatedRequest } from '../types/express';

type AsyncFunction<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<any>;

export const catchAsync = <
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
>(fn: AsyncFunction<P, ResBody, ReqBody, ReqQuery>) => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    fn(req, res, next).catch((err) => {
      const error = err instanceof AppError ? err : new AppError(err.message || 'Something went wrong', 500);
      next(error);
    });
  };
};