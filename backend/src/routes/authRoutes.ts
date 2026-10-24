import { Router } from 'express';
import { signup, verifyOTP, login, googleLogin, refreshToken, logout } from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

export default router;
