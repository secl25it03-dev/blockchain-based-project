import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, generateOTP } from '../utils/auth';
import { logAudit } from '../utils/audit';

const getProfileForUser = async (userId: string, role: string) => {
  if (role === 'ngo') {
    return prisma.ngoProfile.findUnique({ where: { userId } });
  }
  if (role === 'restaurant') {
    return prisma.restaurantProfile.findUnique({ where: { userId } });
  }
  if (role === 'vendor') {
    return prisma.vendorProfile.findUnique({ where: { userId } });
  }
  return null;
};

// Signup
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, ...profileDetails } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields: email, password, name, role' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const { code, expiresAt } = generateOTP();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
        status: 'unverified',
        otp: { code, expiresAt },
      },
    });

    if (role === 'ngo') {
      const { registrationNo, capacity, address, phone, verificationDocument } = profileDetails;
      if (!registrationNo || !capacity || !address || !phone) {
        await prisma.user.delete({ where: { id: newUser.id } });
        return res.status(400).json({ message: 'Missing NGO details: registrationNo, capacity, address, phone' });
      }
      await prisma.ngoProfile.create({
        data: {
          userId: newUser.id,
          registrationNo,
          verificationDocument: verificationDocument || 'https://via.placeholder.com/150',
          capacity,
          address,
          phone,
        },
      });
    } else if (role === 'restaurant') {
      const { licenseNo, address, phone, foodCategories, verificationDocument } = profileDetails;
      if (!licenseNo || !address || !phone) {
        await prisma.user.delete({ where: { id: newUser.id } });
        return res.status(400).json({ message: 'Missing Restaurant details: licenseNo, address, phone' });
      }
      await prisma.restaurantProfile.create({
        data: {
          userId: newUser.id,
          licenseNo,
          verificationDocument: verificationDocument || 'https://via.placeholder.com/150',
          address,
          phone,
          foodCategories: foodCategories || [],
        },
      });
    } else if (role === 'vendor') {
      const { vehicleType, licensePlate, licenseNumber, phone, verificationDocument } = profileDetails;
      if (!vehicleType || !licensePlate || !licenseNumber || !phone) {
        await prisma.user.delete({ where: { id: newUser.id } });
        return res.status(400).json({ message: 'Missing Vendor details: vehicleType, licensePlate, licenseNumber, phone' });
      }
      await prisma.vendorProfile.create({
        data: {
          userId: newUser.id,
          vehicleType,
          licensePlate,
          licenseNumber,
          verificationDocument: verificationDocument || 'https://via.placeholder.com/150',
          phone,
          status: 'offline',
        },
      });
    }

    await logAudit(newUser.id, 'USER_SIGNUP', `Registered as ${role}. Email verification OTP sent.`, req);

    console.log(`[EMAIL DEV MOCK] Sent OTP: ${code} to ${email}`);

    return res.status(201).json({
      message: 'Signup successful. Verify your email using the OTP code.',
      email: newUser.email,
      _dev_otp_: code,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpData = user.otp as { code: string; expiresAt: string | Date } | null;
    const expiresAt = otpData?.expiresAt ? new Date(otpData.expiresAt) : null;

    if (!otpData || otpData.code !== code || !expiresAt || new Date() > expiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    const autoActiveRoles = ['donor', 'admin'];
    const nextStatus = autoActiveRoles.includes(user.role) ? 'active' : 'pending_approval';

    await prisma.user.update({
      where: { id: user.id },
      data: { status: nextStatus, otp: Prisma.DbNull },
    });

    await logAudit(user.id, 'VERIFY_OTP', `Email verified. Account status updated to: ${nextStatus}`, req);

    return res.status(200).json({
      message: nextStatus === 'active'
        ? 'Account successfully verified and activated!'
        : 'Account verified successfully. Pending administrator approval before access.',
      status: nextStatus,
    });
  } catch (error: any) {
    console.error('OTP Verification error:', error);
    return res.status(500).json({ message: 'Server error during OTP verification', error: error.message });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and target role are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: `Access denied. You registered as a ${user.role}, not a ${role}.` });
    }

    if (user.status === 'unverified') {
      return res.status(403).json({ message: 'Email unverified. Please complete OTP verification.', status: 'unverified' });
    }

    if (user.status === 'pending_approval') {
      return res.status(403).json({ message: 'Your account is pending administrator approval.', status: 'pending_approval' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.', status: 'suspended' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role, status: user.status });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role, status: user.status });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    await logAudit(user.id, 'USER_LOGIN', `Logged in successfully as ${role}`, req);

    const profile = await getProfileForUser(user.id, user.role);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
      profile,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Google OAuth Handler (Simulated / Production ready validator)
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token, role, name, email } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ message: 'Google OAuth missing parameters: email, name, role' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const autoActiveRoles = ['donor', 'admin'];
      const nextStatus = autoActiveRoles.includes(role) ? 'active' : 'pending_approval';

      user = await prisma.user.create({
        data: {
          name,
          email,
          role: role as any,
          status: nextStatus,
        },
      });

      if (role === 'ngo') {
        await prisma.ngoProfile.create({
          data: {
            userId: user.id,
            registrationNo: 'GOOG-' + Math.floor(1000 + Math.random() * 9000),
            verificationDocument: 'https://via.placeholder.com/150',
            capacity: 'Medium',
            address: 'Google Shared Location',
            phone: '0000000000',
          },
        });
      } else if (role === 'restaurant') {
        await prisma.restaurantProfile.create({
          data: {
            userId: user.id,
            licenseNo: 'LIC-' + Math.floor(1000 + Math.random() * 9000),
            verificationDocument: 'https://via.placeholder.com/150',
            address: 'Google Shared Location',
            phone: '0000000000',
            foodCategories: [],
          },
        });
      } else if (role === 'vendor') {
        await prisma.vendorProfile.create({
          data: {
            userId: user.id,
            vehicleType: 'bike',
            licensePlate: 'MOCK-GPS',
            licenseNumber: 'DL-' + Math.floor(1000 + Math.random() * 9000),
            verificationDocument: 'https://via.placeholder.com/150',
            phone: '0000000000',
            status: 'idle',
          },
        });
      }

      await logAudit(user.id, 'OAUTH_SIGNUP', `Created verified account using Google OAuth for role: ${role}`, req);
    } else {
      if (user.role !== role) {
        return res.status(403).json({ message: `Access denied. Registered role is ${user.role}, requested was ${role}` });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account is suspended.' });
      }
    }

    if (user.status === 'pending_approval') {
      return res.status(403).json({ message: 'Your Google OAuth account is pending administrator approval.', status: 'pending_approval' });
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role, status: user.status });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role, status: user.status });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    await logAudit(user.id, 'OAUTH_LOGIN', `Logged in using Google OAuth`, req);

    const profile = await getProfileForUser(user.id, user.role);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
      profile,
    });
  } catch (error: any) {
    console.error('Google OAuth Login error:', error);
    return res.status(500).json({ message: 'Server error during OAuth', error: error.message });
  }
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const user = await prisma.user.findFirst({ where: { refreshToken: token } });
    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    try {
      const decoded = verifyRefreshToken(token) as any;
      if (decoded.id !== user.id) {
        return res.status(403).json({ message: 'Token verification failed' });
      }

      const newAccessToken = generateAccessToken({ id: user.id, role: user.role, status: user.status });
      const newRefreshToken = generateRefreshToken({ id: user.id, role: user.role, status: user.status });

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
      return res.status(403).json({ message: 'Expired refresh token' });
    }
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Server error during token refresh', error: error.message });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (token) {
      const user = await prisma.user.findFirst({ where: { refreshToken: token } });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
        await logAudit(user.id, 'USER_LOGOUT', 'Logged out successfully', req);
      }
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
};
