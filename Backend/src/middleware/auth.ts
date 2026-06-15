import { getAuth } from '../lib/auth.js';
import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required',
    });
  }
  next();
}

import { clerkClient } from '@clerk/express';

export function requireRole(role: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
    }

    let userMetadata = auth.sessionClaims?.metadata as Record<string, any> | undefined;
    let userRole = userMetadata?.role;

    // Fallback: If not in session claims, query Clerk API directly (avoiding required Clerk custom session token setup)
    if (!userRole && auth.userId && auth.userId !== 'mock_user_123') {
      try {
        const user = await clerkClient.users.getUser(auth.userId);
        userRole = user.publicMetadata?.role as string | undefined;
      } catch (err) {
        console.error('Error fetching user metadata from Clerk in requireRole middleware:', err);
      }
    }

    if (userRole !== role) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
}
