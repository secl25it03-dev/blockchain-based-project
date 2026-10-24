import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'donor' | 'vendor' | 'restaurant' | 'ngo';
    status: 'unverified' | 'pending_approval' | 'active' | 'suspended';
    name?: string;
  };
}

export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token) as AuthenticatedRequest['user'];
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

export const requireRole = (roles: Array<'admin' | 'donor' | 'vendor' | 'restaurant' | 'ngo'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
};

export const requireActive = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.status !== 'active') {
    return res.status(403).json({
      message: `Access denied: Account status is ${req.user.status}`,
      status: req.user.status,
    });
  }

  next();
};

// Convenient aliases
export const authenticate = authenticateUser;
export const authorize = requireRole;
