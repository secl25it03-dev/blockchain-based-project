import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  // Establish database connection
  await connectDB();

  // Start listening
  const server = app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`DONATO API Server started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
  });

  // Handle termination signals
  const shutdown = () => {
    console.log('Shutting down API server gracefully...');
    server.close(() => {
      console.log('API server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
