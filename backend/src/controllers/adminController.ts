import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
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

// Fetch users pending approval
export const getPendingApprovals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'pending_approval' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const enrichedList = await Promise.all(
      pendingUsers.map(async (user) => {
        const profile = await getProfileForUser(user.id, user.role);
        return {
          user,
          profile,
        };
      })
    );

    return res.status(200).json(enrichedList);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching pending approvals', error: error.message });
  }
};

// Approve user registration
export const approveUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const { status } = req.body; // 'active' or 'suspended'

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Valid status ("active" or "suspended") is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.update({ where: { id: userId }, data: { status: status as any } });

    if (user.role === 'vendor') {
      await prisma.vendorProfile.updateMany({
        where: { userId },
        data: { status: status === 'active' ? 'idle' : 'offline' },
      });
    }

    await logAudit(
      req.user?.id,
      'APPROVE_USER',
      `Set status of user ${user.email} (${user.role}) to ${status}`,
      req
    );

    return res.status(200).json({ message: `User account successfully ${status}` });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error approving user', error: error.message });
  }
};

// List all users
export const listUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.query.role as string | undefined;
    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : {},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching users list', error: error.message });
  }
};

// Get platform settings and logs
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return res.status(200).json(logs);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
};

// Get Analytics
export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersCount = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const foodStats = await prisma.foodDonation.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const monetaryTotal = await prisma.monetaryDonation.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true },
    });

    const wasteTotal = await prisma.wasteLog.groupBy({
      by: ['reason'],
      _sum: { quantity: true },
    });

    const analytics = {
      users: {
        admin: 0,
        donor: 0,
        vendor: 0,
        restaurant: 0,
        ngo: 0,
      },
      foodDonations: {
        pending: 0,
        claimed: 0,
        picked_up: 0,
        delivered: 0,
        cancelled: 0,
      },
      monetaryTotal: monetaryTotal._sum.amount ?? 0,
      wasteSummary: {
        expired: 0,
        damaged: 0,
        spoiled: 0,
        other: 0,
      },
    };

    usersCount.forEach((item) => {
      analytics.users[item.role] = item._count.role;
    });

    foodStats.forEach((item) => {
      analytics.foodDonations[item.status] = item._count.status;
    });

    wasteTotal.forEach((item) => {
      analytics.wasteSummary[item.reason] = item._sum.quantity ?? 0;
    });

    return res.status(200).json(analytics);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error generating platform analytics', error: error.message });
  }
};

// Fraud Detection Alerts
export const getFraudAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts: Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string; data: any }> = [];

    const expiredDonations = await prisma.foodDonation.findMany({
      where: { status: { in: ['pending', 'claimed'] } },
      include: {
        donor: { select: { name: true, email: true } },
      },
    });

    const now = new Date();
    expiredDonations.forEach((donation) => {
      const items = donation.items as Array<{ name: string; expiryTime: string | Date }>;
      const hasExpired = items.some((item) => new Date(item.expiryTime) < now);
      if (hasExpired) {
        alerts.push({
          type: 'EXPIRED_UNRESOLVED_DONATION',
          severity: 'high',
          message: `Listing donation #${donation.id} contains expired items but is still marked as ${donation.status}`,
          data: {
            donationId: donation.id,
            donorName: donation.donor?.name,
            status: donation.status,
          },
        });
      }
    });

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const stalledDeliveries = await prisma.foodDonation.findMany({
      where: {
        status: { in: ['claimed', 'picked_up'] },
        updatedAt: { lt: fourHoursAgo },
      },
      include: {
        donor: { select: { name: true, email: true } },
        claimedByNGO: { select: { name: true, email: true } },
        assignedVendor: { select: { name: true, email: true } },
      },
    });

    stalledDeliveries.forEach((del) => {
      alerts.push({
        type: 'STALLED_DELIVERY',
        severity: 'medium',
        message: `Delivery for donation #${del.id} has been stalled in "${del.status}" state for over 4 hours`,
        data: {
          donationId: del.id,
          ngo: del.claimedByNGO?.name,
          vendor: del.assignedVendor?.name,
          lastUpdated: del.updatedAt,
        },
      });
    });

    const largeWasteLogs = await prisma.wasteLog.findMany({
      where: { quantity: { gt: 100 } },
      include: {
        restaurant: { select: { name: true, email: true } },
      },
    });

    largeWasteLogs.forEach((log) => {
      alerts.push({
        type: 'EXCESSIVE_WASTE_REPORT',
        severity: 'low',
        message: `Restaurant "${log.restaurant?.name}" logged a massive waste record of ${log.quantity} ${log.unit} due to "${log.reason}"`,
        data: {
          restaurant: log.restaurant?.name,
          item: log.name,
          quantity: log.quantity,
          reason: log.reason,
          date: log.wasteDate,
        },
      });
    });

    return res.status(200).json(alerts);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error checking fraud analytics', error: error.message });
  }
};
