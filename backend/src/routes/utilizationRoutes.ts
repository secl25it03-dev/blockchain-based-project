import { Router } from 'express';
import {
  submitUtilizationReport,
  reviewUtilizationReport,
  getCampaignUtilizationBreakdown,
} from '../controllers/utilizationController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Public route to view "Where Your Money Goes"
router.get('/campaign/:campaignId', getCampaignUtilizationBreakdown);

// Protected NGO route to submit utilization report
router.post('/submit', authenticate, authorize(['ngo', 'admin']), submitUtilizationReport);

// Protected Admin route to review, approve/reject, and anchor report on-chain
router.patch('/review/:reportId', authenticate, authorize(['admin']), reviewUtilizationReport);

export default router;
