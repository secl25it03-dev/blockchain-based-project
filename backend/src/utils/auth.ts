import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'donato_super_secret_access_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'donato_super_secret_refresh_key_54321';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (user: { id: string; role: string; status: string }): string => {
  return jwt.sign(
    { id: user.id, role: user.role, status: user.status },
    JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes access token expiry
  );
};

export const generateRefreshToken = (user: { id: string; role: string; status: string }): string => {
  return jwt.sign(
    { id: user.id, role: user.role, status: user.status },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 days refresh token expiry
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

export const generateOTP = () => {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Valid for 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  return { code, expiresAt };
};
