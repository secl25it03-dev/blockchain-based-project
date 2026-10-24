import { Router } from 'express';
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaignStatus,
} from '../controllers/campaignController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);

// Protected routes (NGO and Admin)
router.post('/', authenticate, createCampaign);
router.patch('/:id/status', authenticate, updateCampaignStatus);

export default router;
