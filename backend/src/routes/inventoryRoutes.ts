import { Router } from 'express';
import {
  getInventory,
  addInventory,
  logWaste,
  getInventoryAnalytics,
  getNotifications,
  markNotificationRead,
} from '../controllers/inventoryController';
import { authenticateUser, requireRole, requireActive } from '../middlewares/auth';

const router = Router();

router.use(authenticateUser);
router.use(requireActive);

// Notifications endpoints (general for all roles)
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Inventory endpoints (secured for restaurant/supermarket roles)
router.get('/', requireRole(['restaurant', 'admin']), getInventory);
router.post('/', requireRole(['restaurant', 'admin']), addInventory);
router.post('/waste', requireRole(['restaurant', 'admin']), logWaste);
router.get('/analytics', requireRole(['restaurant', 'admin']), getInventoryAnalytics);

export default router;
