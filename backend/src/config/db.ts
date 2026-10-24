import { prisma } from '../prisma';

export const connectDB = async () => {
  try {
    console.log('Connecting to Prisma database...');
    await prisma.$connect();
    console.log('Prisma connected successfully.');
  } catch (error) {
    console.error('Prisma Connection Error:', error);
    console.warn('Continuing without a database connection. The app will start, but database-backed routes may not work until the database is reachable.');
  }
};
