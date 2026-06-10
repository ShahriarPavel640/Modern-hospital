import { getAuth as clerkGetAuth } from '@clerk/express';
import { Request } from 'express';

export function getAuth(req: Request) {
  if (process.env.NODE_ENV !== 'production' && req.headers['x-mock-auth']) {
    const mockRole = req.headers['x-mock-role'] as string || 'patient';
    const mockEmail = req.headers['x-mock-email'] as string || 'test@example.com';
    const mockPhone = req.headers['x-mock-phone'] as string || '01712345678';
    
    return {
      userId: 'mock_user_123',
      sessionClaims: {
        email: mockEmail,
        metadata: {
          role: mockRole,
          phone: mockPhone
        }
      }
    } as any;
  }
  return clerkGetAuth(req);
}
