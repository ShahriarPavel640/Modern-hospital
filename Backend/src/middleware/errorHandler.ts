import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('🔴 Server Error:', err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Prisma request errors using error code mappings
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        statusCode = 400;
        const target = (err.meta?.target as string[])?.join(', ') || 'fields';
        message = `Unique constraint failed: A record with this value for ${target} already exists.`;
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed: Operation would violate database integrity (e.g. referenced record exists).';
        break;
      case 'P2025':
        statusCode = 404;
        message = (err.meta?.cause as string) || 'Record to update or delete not found.';
        break;
      default:
        statusCode = 400;
        message = `Database error: ${err.message || 'Operation failed'}`;
    }
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
