import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { logAudit } from '../utils/audit';
import { BlockchainService } from '../blockchain/blockchainService';

export const createCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, beneficiaryStory, category, targetAmount, currency, bannerImage, deadline } = req.body;

    if (!title || !description || !targetAmount) {
      return res.status(400).json({ message: 'Title, description, and targetAmount are required' });
    }

    if (Number(targetAmount) <= 0) {
      return res.status(400).json({ message: 'Target amount must be greater than 0' });
    }

    // Ensure NGO is verified or user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { ngoProfile: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin' && (user.role !== 'ngo' || user.status !== 'active')) {
      return res.status(403).json({
        message: 'Only verified and active NGOs or administrators can create campaigns',
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        ngoId: user.id,
        title,
        description,
        beneficiaryStory: beneficiaryStory || '',
        category: category || 'food_hunger',
        targetAmount: Number(targetAmount),
        currency: currency || 'USD',
        bannerImage: bannerImage || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
        deadline: deadline ? new Date(deadline) : undefined,
        status: 'active',
      },
    });

    // Register campaign on smart contract
    const ngoWallet = user.ngoProfile?.walletAddress || user.walletAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const chainRecord = await BlockchainService.registerCampaign(
      campaign.id,
      ngoWallet,
      Number(targetAmount),
      `ipfs://campaign-${campaign.id}`
    );

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        onChainCampaignId: chainRecord.txHash,
      },
      include: {
        ngo: {
          select: { id: true, name: true, email: true, ngoProfile: true },
        },
      },
    });

    await logAudit(
      req.user?.id,
      'CREATE_CAMPAIGN',
      `Created campaign "${title}" with on-chain proof ${chainRecord.txHash}`,
      req
    );

    return res.status(201).json({
      message: 'Campaign created and registered on blockchain registry successfully',
      campaign: updatedCampaign,
      blockchain: chainRecord,
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ message: 'Error creating campaign', error: error.message });
  }
};

export const getAllCampaigns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, status, search } = req.query;

    const whereClause: any = {};
    if (category) {
      whereClause.category = category;
    }
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = 'active';
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: {
        ngo: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            ngoProfile: true,
          },
        },
        _count: {
          select: { donations: true, utilizationReports: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(campaigns);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
  }
};

export const getCampaignById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);

    const campaign = await (prisma.campaign as any).findUnique({
      where: { id },
      include: {
        ngo: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            ngoProfile: true,
          },
        },
        donations: {
          where: { status: 'completed' },
          select: {
            id: true,
            donationRef: true,
            amount: true,
            currency: true,
            channel: true,
            isAnonymous: true,
            donorName: true,
            txHash: true,
            verifiedOnChain: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        utilizationReports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Calculate transparency breakdown
    const totalSpent = (campaign.utilizationReports || [])
      .filter((r: any) => r.verificationStatus === 'verified_by_admin')
      .reduce((sum: number, r: any) => sum + Number(r.amountSpent || 0), 0);

    const remainingBalance = Math.max(0, campaign.raisedAmount - totalSpent);

    return res.status(200).json({
      ...campaign,
      transparencyStats: {
        targetAmount: campaign.targetAmount,
        raisedAmount: campaign.raisedAmount,
        totalSpentVerified: totalSpent,
        remainingBalance,
        percentFunded: Math.min(100, Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)),
        percentUtilized: campaign.raisedAmount > 0 ? Math.min(100, Math.round((totalSpent / campaign.raisedAmount) * 100)) : 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching campaign details', error: error.message });
  }
};

export const updateCampaignStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!['active', 'completed', 'paused', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid campaign status' });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Verify ownership or admin
    if (req.user?.role !== 'admin' && campaign.ngoId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized to update this campaign' });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status },
    });

    await logAudit(req.user?.id, 'UPDATE_CAMPAIGN_STATUS', `Changed status of campaign ${id} to ${status}`, req);

    return res.status(200).json({ message: 'Campaign status updated', campaign: updated });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating campaign status', error: error.message });
  }
};
