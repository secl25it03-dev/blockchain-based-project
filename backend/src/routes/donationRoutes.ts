import { Router } from 'express';
import {
  createFoodDonation,
  getAvailableDonations,
  claimDonation,
  assignVendor,
  updateDeliveryStatus,
  getDonorHistory,
  getNGOHistory,
  getVendorTasks,
  getAvailableVendors,
  createPaymentSession,
  verifyPayment,
} from '../controllers/donationController';
import {
  initiateDonation,
  reconcilePayment,
  recordWeb3Donation,
  getDigitalReceipt,
  getUserDonations,
} from '../controllers/donationRecordController';
import { authenticateUser, requireRole, requireActive } from '../middlewares/auth';

const router = Router();

// --- BLOCKCHAIN & MONETARY TRANSPARENT DONATION ROUTES ---

// Public receipt lookup
router.get('/receipt/:ref', getDigitalReceipt);

// Optional auth helper middleware for public checkout
const optionalAuth = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    return authenticateUser(req, res, next);
  }
  next();
};

// Initiate payment (mock/sandbox or fiat gateway)
router.post('/initiate', optionalAuth, initiateDonation);

// Reconcile off-chain payment with blockchain smart contract
router.post('/reconcile', optionalAuth, reconcilePayment);

// Record Web3 MetaMask on-chain donation
router.post('/web3', optionalAuth, recordWeb3Donation);

// Legacy monetary routes (for backward compatibility)
router.post('/monetary', optionalAuth, createPaymentSession);
router.post('/monetary/verify', optionalAuth, verifyPayment);

// --- AUTHENTICATED USER & FOOD DONATION ROUTES ---
router.use(authenticateUser);

// Personal donation history
router.get('/my-history', getUserDonations);

// Require active account for logistics actions
router.use(requireActive);

router.post('/food', requireRole(['donor', 'restaurant', 'admin']), createFoodDonation);
router.get('/food/available', requireRole(['ngo', 'admin']), getAvailableDonations);
router.post('/food/:id/claim', requireRole(['ngo', 'admin']), claimDonation);
router.post('/food/:id/assign', requireRole(['ngo', 'admin']), assignVendor);
router.post('/food/:id/status', requireRole(['vendor', 'admin']), updateDeliveryStatus);

router.get('/history/donor', requireRole(['donor', 'restaurant', 'admin']), getDonorHistory);
router.get('/history/ngo', requireRole(['ngo', 'admin']), getNGOHistory);
router.get('/history/vendor', requireRole(['vendor', 'admin']), getVendorTasks);
router.get('/vendors/available', requireRole(['ngo', 'admin']), getAvailableVendors);

export default router;
