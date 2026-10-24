import { Request, Response, NextFunction } from 'express';

const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const maxRequestsPerWindow = 100;

// Simple in-memory cache
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = ipRequestMap.get(ip);

  if (!record) {
    ipRequestMap.set(ip, {
      count: 1,
      resetTime: now + rateLimitWindowMs,
    });
    return next();
  }

  if (now > record.resetTime) {
    // Window expired, reset
    record.count = 1;
    record.resetTime = now + rateLimitWindowMs;
    return next();
  }

  record.count += 1;

  if (record.count > maxRequestsPerWindow) {
    return res.status(429).json({
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    });
  }

  next();
};
