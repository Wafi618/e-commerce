import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Get token from cookie or Authorization header
      const token = req.cookies['auth-token'] || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
      };

      // Attach user to request
      req.user = decoded;

      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  };
}

/**
 * Middleware to verify user has admin role
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    return handler(req, res);
  });
}

/**
 * Optional auth - doesn't fail if no token, but adds user if present
 */
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = req.cookies['auth-token'] || req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: string;
        };
        req.user = decoded;
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log('Optional auth failed, continuing without user');
    }

    return handler(req, res);
  };
}
