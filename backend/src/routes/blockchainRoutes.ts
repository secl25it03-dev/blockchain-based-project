import { Router } from 'express';
import {
  verifyBlockchainRecord,
  getRegistryStatus,
} from '../controllers/blockchainController';

const router = Router();

// Public verification and explorer routes
router.get('/verify', verifyBlockchainRecord);
router.get('/status', getRegistryStatus);

export default router;
