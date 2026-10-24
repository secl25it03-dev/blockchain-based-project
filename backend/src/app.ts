import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimiter } from './middlewares/rateLimit';

// Import routers
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import donationRoutes from './routes/donationRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import campaignRoutes from './routes/campaignRoutes';
import utilizationRoutes from './routes/utilizationRoutes';
import blockchainRoutes from './routes/blockchainRoutes';

const app = express();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/utilization', utilizationRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[UNHANDLED EXCEPTION]:', err);
  return res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
