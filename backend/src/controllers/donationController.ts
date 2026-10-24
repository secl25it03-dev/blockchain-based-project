import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { logAudit } from '../utils/audit';

const createNotification = async (recipientId: string, title: string, message: string, type: 'donation' | 'delivery' | 'general') => {
  try {
    await prisma.notification.create({
      data: {
        recipientId,
        title,
        message,
        type,
      },
    });
  } catch (err) {
    console.error('Notification creation failed:', err);
  }
};

export const createFoodDonation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, pickupAddress, coordinates } = req.body;

    if (!items || !pickupAddress || !coordinates) {
      return res.status(400).json({ message: 'Missing required parameters: items, pickupAddress, coordinates' });
    }

    const donation = await prisma.foodDonation.create({
      data: {
        donorId: req.user?.id!,
        items,
        pickupAddress,
        coordinates,
        status: 'pending',
      },
    });

    await logAudit(req.user?.id, 'CREATE_FOOD_DONATION', `Listed food donation #${donation.id}`, req);

    const ngos = await prisma.user.findMany({ where: { role: 'ngo', status: 'active' } });
    for (const ngo of ngos) {
      await createNotification(
        ngo.id,
        'New Surplus Food Available!',
        `A donor has listed surplus food at ${pickupAddress}. Claim it now.`,
        'donation'
      );
    }

    return res.status(201).json({ message: 'Food donation listed successfully', donation });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating food donation', error: error.message });
  }
};

export const getAvailableDonations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const donations = await prisma.foodDonation.findMany({
      where: { status: 'pending' },
      include: { donor: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    return res.status(200).json(donations);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching available donations', error: error.message });
  }
};

export const claimDonation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }

    const donation = await prisma.foodDonation.findUnique({ where: { id } });

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({ message: 'Donation has already been claimed or processed' });
    }

    const updatedDonation = await prisma.foodDonation.update({
      where: { id },
      data: {
        status: 'claimed',
        claimedByNGOId: req.user?.id,
      },
    });

    await logAudit(req.user?.id, 'CLAIM_FOOD_DONATION', `Claimed food donation #${updatedDonation.id}`, req);

    await createNotification(
      updatedDonation.donorId,
      'Your Food Donation is Claimed!',
      `An NGO has claimed your donation #${updatedDonation.id}. Delivery assignment pending.`,
      'donation'
    );

    return res.status(200).json({ message: 'Donation claimed successfully', donation: updatedDonation });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error claiming donation', error: error.message });
  }
};

export const assignVendor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const { vendorId } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }

    if (!vendorId) {
      return res.status(400).json({ message: 'vendorId is required' });
    }

    const donation = await prisma.foodDonation.findUnique({ where: { id } });
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'claimed') {
      return res.status(400).json({ message: 'Donation must be in "claimed" state to assign a vendor' });
    }

    const vendor = await prisma.user.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.role !== 'vendor' || vendor.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or inactive vendor' });
    }

    const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: vendorId } });
    if (!vendorProfile || vendorProfile.status !== 'idle') {
      return res.status(400).json({ message: 'Vendor is offline or busy with another delivery' });
    }

    const updatedDonation = await prisma.foodDonation.update({
      where: { id },
      data: { assignedVendorId: vendorId },
    });

    await prisma.vendorProfile.update({
      where: { userId: vendorId },
      data: { status: 'delivering' },
    });

    await logAudit(req.user?.id, 'ASSIGN_VENDOR', `Assigned vendor ${vendor.email} to donation #${updatedDonation.id}`, req);

    await createNotification(
      vendorId,
      'New Pickup Request Assigned!',
      `You have been assigned to pick up food from ${updatedDonation.pickupAddress}.`,
      'delivery'
    );

    return res.status(200).json({ message: 'Vendor assigned successfully', donation: updatedDonation });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error assigning vendor', error: error.message });
  }
};

export const updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }

    if (!status || !['picked_up', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "picked_up" or "delivered"' });
    }

    const donation = await prisma.foodDonation.findUnique({ where: { id } });
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.assignedVendorId !== req.user?.id) {
      return res.status(403).json({ message: 'You are not authorized for this pickup delivery' });
    }

    const updatedDonation = await prisma.foodDonation.update({
      where: { id },
      data: {
        status: status as any,
        deliveryProof:
          status === 'delivered'
            ? {
                image: req.body.proofImage || 'https://via.placeholder.com/200?text=Signature+Proof',
                notes: req.body.notes || 'Delivered successfully.',
                uploadedAt: new Date(),
              }
            : undefined,
      },
    });

    if (status === 'delivered') {
      await prisma.vendorProfile.updateMany({
        where: { userId: req.user?.id },
        data: { status: 'idle' },
      });

      if (updatedDonation.claimedByNGOId) {
        await createNotification(
          updatedDonation.claimedByNGOId,
          'Food Donation Delivered!',
          `Donation #${updatedDonation.id} has been delivered by the vendor.`,
          'delivery'
        );
      }

      await createNotification(
        updatedDonation.donorId,
        'Donation Completed!',
        `Your food donation #${updatedDonation.id} has been safely delivered. Thank you!`,
        'donation'
      );
    } else {
      await createNotification(
        updatedDonation.donorId,
        'Food Picked Up!',
        `Vendor is on their way with your donation.`,
        'delivery'
      );
    }

    await logAudit(req.user?.id, `DELIVERY_STATUS_${status.toUpperCase()}`, `Updated donation #${updatedDonation.id} status to ${status}`, req);

    return res.status(200).json({ message: `Status updated to ${status}`, donation: updatedDonation });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating delivery status', error: error.message });
  }
};

export const getDonorHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const foodHistory = await prisma.foodDonation.findMany({
      where: { donorId: req.user?.id },
      include: {
        claimedByNGO: { select: { id: true, name: true, email: true } },
        assignedVendor: { select: { id: true, name: true, email: true } },
      },
    });

    const moneyHistory = await prisma.monetaryDonation.findMany({
      where: { donorId: req.user?.id },
      include: {
        ngoRecipient: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({ food: foodHistory, monetary: moneyHistory });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

export const getNGOHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const claims = await prisma.foodDonation.findMany({
      where: { claimedByNGOId: req.user?.id },
      include: {
        donor: { select: { id: true, name: true, email: true } },
        assignedVendor: { select: { id: true, name: true, email: true } },
      },
    });
    return res.status(200).json(claims);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching NGO claims', error: error.message });
  }
};

export const getVendorTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await prisma.foodDonation.findMany({
      where: { assignedVendorId: req.user?.id },
      include: {
        donor: { select: { id: true, name: true, email: true } },
        claimedByNGO: { select: { id: true, name: true, email: true } },
      },
    });
    return res.status(200).json(tasks);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching vendor tasks', error: error.message });
  }
};

export const getAvailableVendors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idleProfiles = await prisma.vendorProfile.findMany({
      where: { status: 'idle' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    return res.status(200).json(idleProfiles);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching idle vendors', error: error.message });
  }
};

export const createPaymentSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, currency, ngoRecipientId, gateway } = req.body;

    if (!amount || !gateway) {
      return res.status(400).json({ message: 'Amount and gateway (stripe/razorpay) are required' });
    }

    const paymentId = 'pay_' + Math.floor(1000000000 + Math.random() * 9000000000);

    const newDonation = await prisma.monetaryDonation.create({
      data: {
        donorId: req.user?.id,
        amount: Number(amount),
        currency: currency || 'USD',
        paymentGateway: gateway as any,
        paymentId,
        status: 'pending',
        ngoRecipientId: ngoRecipientId || undefined,
      },
    });

    const checkoutUrl = `/donate/checkout-mock?paymentId=${paymentId}&amount=${amount}&gateway=${gateway}`;

    return res.status(200).json({
      checkoutUrl,
      paymentId,
      message: 'Payment session created successfully (Mock sandbox session)',
      donation: newDonation,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error starting payment session', error: error.message });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId, status } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({ message: 'paymentId and validation status are required' });
    }

    const donation = await prisma.monetaryDonation.findUnique({ where: { paymentId } });
    if (!donation) {
      return res.status(404).json({ message: 'Payment transaction record not found' });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({ message: 'Payment has already been processed' });
    }

    const updatedDonation = await prisma.monetaryDonation.update({
      where: { paymentId },
      data: { status: status as any },
    });

    await logAudit(
      updatedDonation.donorId ?? undefined,
      `PAYMENT_VERIFIED_${status.toUpperCase()}`,
      `Processed monetary payment #${paymentId} for amount ${updatedDonation.amount}`,
      req
    );

    if (status === 'completed' && updatedDonation.ngoRecipientId) {
      await createNotification(
        updatedDonation.ngoRecipientId,
        'Monetary Contribution Received!',
        `A donor contributed ${updatedDonation.amount} ${updatedDonation.currency} to your organization.`,
        'donation'
      );
    }

    return res.status(200).json({
      message: `Payment successfully processed to state: ${status}`,
      donation: updatedDonation,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error verifying payment details', error: error.message });
  }
};
