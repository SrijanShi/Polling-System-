import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong'
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};