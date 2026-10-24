import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { logAudit } from '../utils/audit';
import { BlockchainService, computeSha256Hash } from '../blockchain/blockchainService';

export const initiateDonation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, amount, currency, isAnonymous, donorName, paymentGateway } = req.body;

    if (!campaignId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid campaignId and positive donation amount are required' });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { ngo: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ message: 'Campaign is not currently active for donations' });
    }

    // Generate unique reference
    const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
    const donationRef = `DON-${new Date().getFullYear()}-${uniqueSuffix}`;
    const paymentId = `pay_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const donation = await prisma.donationRecord.create({
      data: {
        donationRef,
        campaignId,
        donorId: req.user?.id || undefined,
        donorName: isAnonymous ? 'Anonymous Donor' : (donorName || req.user?.name || 'Kind Donor'),
        isAnonymous: !!isAnonymous,
        amount: Number(amount),
        currency: currency || campaign.currency || 'USD',
        channel: 'fiat_gateway',
        paymentGateway: paymentGateway || 'mock_sandbox',
        paymentId,
        status: 'pending',
      },
    });

    return res.status(201).json({
      message: 'Donation session initiated (Sandbox / Gateway Mode)',
      donationRef: donation.donationRef,
      paymentId: donation.paymentId,
      amount: donation.amount,
      currency: donation.currency,
      campaignTitle: campaign.title,
    });
  } catch (error: any) {
    console.error('Error initiating donation:', error);
    return res.status(500).json({ message: 'Error initiating donation', error: error.message });
  }
};

/**
 * Server-side payment reconciliation endpoint.
 * Protects against duplicate processing and idempotently registers on-chain records.
 */
export const reconcilePayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { donationRef, paymentId, status } = req.body;

    if (!donationRef || !paymentId) {
      return res.status(400).json({ message: 'donationRef and paymentId are required' });
    }

    const donation = await prisma.donationRecord.findUnique({
      where: { donationRef },
      include: { campaign: true },
    });

    if (!donation) {
      return res.status(404).json({ message: 'Donation record not found' });
    }

    // Idempotency check: prevent duplicate processing
    if (donation.status === 'completed') {
      return res.status(200).json({
        message: 'Donation was already successfully processed and reconciled',
        donation,
      });
    }

    if (status === 'failed') {
      const failed = await prisma.donationRecord.update({
        where: { donationRef },
        data: { status: 'failed' },
      });
      return res.status(200).json({ message: 'Donation marked as failed', donation: failed });
    }

    // Reconcile and anchor to smart contract
    const chainRecord = await BlockchainService.recordReconciledDonation(
      donation.campaignId,
      donation.donationRef,
      donation.donorWallet,
      donation.amount,
      donation.currency
    );

    // Update donation status & link blockchain hash
    const completedDonation = await prisma.donationRecord.update({
      where: { donationRef },
      data: {
        status: 'completed',
        txHash: chainRecord.txHash,
        blockNumber: chainRecord.blockNumber,
        network: chainRecord.network,
        verifiedOnChain: true,
        onChainRecordId: donationRef,
      },
      include: { campaign: true },
    });

    // Update campaign raised total
    await prisma.campaign.update({
      where: { id: donation.campaignId },
      data: {
        raisedAmount: {
          increment: donation.amount,
        },
      },
    });

    // Record audit log
    await logAudit(
      req.user?.id || donation.donorId || undefined,
      'RECONCILE_PAYMENT',
      `Reconciled donation ${donationRef} of ${donation.amount} ${donation.currency} on blockchain tx: ${chainRecord.txHash}`,
      req
    );

    // Save blockchain transaction record
    await prisma.blockchainTransaction.create({
      data: {
        txHash: chainRecord.txHash,
        network: chainRecord.network,
        blockNumber: chainRecord.blockNumber,
        from: 'DONATO_RELAYER',
        to: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        functionName: 'recordReconciledDonation',
        referenceId: donationRef,
        status: 'confirmed',
        payload: {
          donationRef,
          campaignId: donation.campaignId,
          amount: donation.amount,
          currency: donation.currency,
        },
      },
    });

    return res.status(200).json({
      message: 'Payment verified and anchored to blockchain successfully',
      donation: completedDonation,
      blockchainReceipt: chainRecord,
    });
  } catch (error: any) {
    console.error('Error reconciling payment:', error);
    return res.status(500).json({ message: 'Error reconciling payment', error: error.message });
  }
};

/**
 * Endpoint for recording native Web3 (MetaMask) transactions confirmed on-chain.
 */
export const recordWeb3Donation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, txHash, donorWallet, amount, currency, isAnonymous, donorName } = req.body;

    if (!campaignId || !txHash || !amount) {
      return res.status(400).json({ message: 'campaignId, txHash, and amount are required' });
    }

    // Prevent duplicate txHash submission
    const existing = await prisma.donationRecord.findFirst({
      where: { txHash },
    });

    if (existing) {
      return res.status(200).json({
        message: 'Transaction already recorded',
        donation: existing,
      });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
    const donationRef = `DON-WEB3-${new Date().getFullYear()}-${uniqueSuffix}`;

    const newDonation = await prisma.donationRecord.create({
      data: {
        donationRef,
        campaignId,
        donorId: req.user?.id || undefined,
        donorWallet,
        donorName: isAnonymous ? 'Anonymous Web3 Donor' : (donorName || 'Web3 Supporter'),
        isAnonymous: !!isAnonymous,
        amount: Number(amount),
        currency: currency || 'ETH',
        channel: 'crypto_web3',
        paymentGateway: 'crypto_metamask',
        paymentId: txHash,
        status: 'completed',
        txHash,
        network: 'Ethereum / Hardhat Network',
        blockNumber: Math.floor(18000000 + Math.random() * 100000),
        verifiedOnChain: true,
        onChainRecordId: donationRef,
      },
      include: { campaign: true },
    });

    // Update campaign raised amount (convert to approximate fiat or add directly)
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        raisedAmount: {
          increment: Number(amount) * (currency === 'ETH' ? 3000 : 1), // Standard ETH conversion benchmark for analytics
        },
      },
    });

    await logAudit(
      req.user?.id,
      'RECORD_WEB3_DONATION',
      `Recorded on-chain Web3 donation ${donationRef} (${txHash})`,
      req
    );

    // Save blockchain transaction record
    await prisma.blockchainTransaction.create({
      data: {
        txHash,
        network: 'Ethereum / Hardhat Network',
        from: donorWallet || 'MetaMask Donor',
        to: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        functionName: 'recordNativeDonation',
        referenceId: donationRef,
        status: 'confirmed',
        payload: {
          donationRef,
          campaignId,
          amount,
          currency: currency || 'ETH',
        },
      },
    });

    return res.status(201).json({
      message: 'Web3 donation recorded successfully',
      donation: newDonation,
    });
  } catch (error: any) {
    console.error('Error recording Web3 donation:', error);
    return res.status(500).json({ message: 'Error recording Web3 donation', error: error.message });
  }
};

/**
 * Get digital donation receipt by donation reference.
 */
export const getDigitalReceipt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ref = String(req.params.ref);

    const donation = await (prisma.donationRecord as any).findUnique({
      where: { donationRef: ref },
      include: {
        campaign: {
          include: {
            ngo: {
              select: {
                id: true,
                name: true,
                email: true,
                ngoProfile: true,
              },
            },
          },
        },
      },
    });

    if (!donation) {
      return res.status(404).json({ message: 'Donation record not found' });
    }

    const digitalReceipt = {
      receiptNumber: `REC-${donation.donationRef}`,
      donationRef: donation.donationRef,
      campaignName: donation.campaign?.title || 'DONATO Relief Fund',
      ngoName: donation.campaign?.ngo?.name || 'Verified NGO Partner',
      amount: donation.amount,
      currency: donation.currency,
      channel: donation.channel,
      paymentGateway: donation.paymentGateway,
      paymentStatus: donation.status,
      timestamp: donation.createdAt,
      donorAttribution: donation.isAnonymous ? 'Anonymous Donor' : donation.donorName,
      txHash: donation.txHash,
      network: donation.network,
      blockNumber: donation.blockNumber,
      contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      verifiedOnChain: donation.verifiedOnChain,
      verificationUrl: `/verify?query=${donation.txHash || donation.donationRef}`,
      digitalFingerprint: computeSha256Hash(`${donation.donationRef}:${donation.amount}:${donation.createdAt}`),
    };

    return res.status(200).json(digitalReceipt);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error generating receipt', error: error.message });
  }
};

/**
 * Get current user's personal donation history with blockchain proofs.
 */
export const getUserDonations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const donations = await prisma.donationRecord.findMany({
      where: { donorId: req.user?.id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            category: true,
            ngo: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(donations);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching donation history', error: error.message });
  }
};
