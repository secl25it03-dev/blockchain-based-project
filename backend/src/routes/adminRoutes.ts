import { Router } from 'express';
import { getPendingApprovals, approveUser, listUsers, getAuditLogs, getAnalytics, getFraudAlerts } from '../controllers/adminController';
import { authenticateUser, requireRole, requireActive } from '../middlewares/auth';

const router = Router();

// Secure all admin routes with authentication, role verification, and active status check
router.use(authenticateUser);
router.use(requireRole(['admin']));
router.use(requireActive);

router.get('/approvals', getPendingApprovals);
router.post('/approve/:userId', approveUser);
router.get('/users', listUsers);
router.get('/audit-logs', getAuditLogs);
router.get('/analytics', getAnalytics);
router.get('/fraud-alerts', getFraudAlerts);

export default router;
