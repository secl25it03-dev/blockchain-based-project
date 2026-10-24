import app from '../src/app';
import { connectDB } from '../src/config/db';

export default async (req: any, res: any) => {
  // Ensure the database is connected for serverless invocations
  await connectDB();
  return app(req, res);
};
