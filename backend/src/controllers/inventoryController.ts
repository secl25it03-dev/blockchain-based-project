import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { logAudit } from '../utils/audit';

export const getInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await prisma.inventory.findMany({
      where: { restaurantId: req.user?.id },
      orderBy: { expiryDate: 'asc' },
    });
    return res.status(200).json(items);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
};

export const addInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, quantity, unit, expiryDate, thresholdAlert } = req.body;

    if (!name || !quantity || !unit || !expiryDate) {
      return res.status(400).json({ message: 'Missing required parameters: name, quantity, unit, expiryDate' });
    }

    const item = await prisma.inventory.create({
      data: {
        restaurantId: req.user?.id!,
        name,
        quantity: Number(quantity),
        unit,
        expiryDate: new Date(expiryDate),
        thresholdAlert: Number(thresholdAlert ?? 5),
      },
    });

    await logAudit(req.user?.id, 'ADD_INVENTORY', `Added ${quantity} ${unit} of "${name}" to stock`, req);

    return res.status(201).json({ message: 'Inventory item added successfully', item });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error adding inventory item', error: error.message });
  }
};

export const logWaste = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, quantity, unit, reason, inventoryItemId } = req.body;

    if (!name || !quantity || !unit || !reason) {
      return res.status(400).json({ message: 'Missing required parameters: name, quantity, unit, reason' });
    }

    if (inventoryItemId) {
      const invItem = await prisma.inventory.findUnique({ where: { id: inventoryItemId } });
      if (invItem) {
        const newQuantity = Math.max(0, invItem.quantity - Number(quantity));
        if (newQuantity === 0) {
          await prisma.inventory.delete({ where: { id: inventoryItemId } });
        } else {
          await prisma.inventory.update({
            where: { id: inventoryItemId },
            data: { quantity: newQuantity },
          });
        }
      }
    }

    const waste = await prisma.wasteLog.create({
      data: {
        restaurantId: req.user?.id!,
        name,
        quantity: Number(quantity),
        unit,
        reason: reason as any,
      },
    });

    await logAudit(req.user?.id, 'LOG_WASTE', `Logged ${quantity} ${unit} of "${name}" as waste due to ${reason}`, req);

    return res.status(201).json({ message: 'Waste logged successfully', waste });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error logging waste', error: error.message });
  }
};

export const getInventoryAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const restaurantId = req.user?.id!;

    const wasteSummaryRecords = await prisma.wasteLog.groupBy({
      by: ['reason'],
      where: { restaurantId },
      _sum: { quantity: true },
    });

    const donationsCount = await prisma.foodDonation.count({ where: { donorId: restaurantId } });

    const twoDaysFromNow = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const expiringStock = await prisma.inventory.findMany({
      where: {
        restaurantId,
        expiryDate: { lte: twoDaysFromNow },
      },
    });

    const restaurantInventory = await prisma.inventory.findMany({ where: { restaurantId } });
    const lowStock = restaurantInventory.filter((item) => item.quantity < item.thresholdAlert);

    const waste = wasteSummaryRecords.reduce((acc, curr) => ({
      ...acc,
      [curr.reason]: curr._sum.quantity ?? 0,
    }), {
      expired: 0,
      damaged: 0,
      spoiled: 0,
      other: 0,
    });

    return res.status(200).json({
      waste,
      donationsCount,
      expiringCount: expiringStock.length,
      expiringItems: expiringStock,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving inventory analytics', error: error.message });
  }
};

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await prisma.notification.findMany({
      where: { recipientId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.status(200).json(list);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    await prisma.notification.updateMany({
      where: { id, recipientId: req.user?.id },
      data: { read: true },
    });
    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating notification status', error: error.message });
  }
};
