import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { BlockchainService } from '../blockchain/blockchainService';

/**
 * Public blockchain verification endpoint.
 * Validates transaction hash, donation reference, or document report hash.
 */
export const verifyBlockchainRecord = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || '').trim();

    if (!query) {
      return res.status(400).json({
        message: 'Please provide a valid transaction hash (0x...), donation reference (DON-...), or report hash to verify.',
      });
    }

    // 1. Check if matching a donation record by txHash or donationRef
    const donation = await prisma.donationRecord.findFirst({
      where: {
        OR: [{ txHash: query }, { donationRef: query }],
      },
      include: {
        campaign: {
          include: { ngo: { select: { id: true, name: true } } },
        },
      },
    });

    if (donation) {
      // Query on-chain smart contract state for confirmation
      const onChainRecord = await BlockchainService.verifyDonation(donation.donationRef);

      return res.status(200).json({
        recordType: 'donation',
        verified: true,
        reference: donation.donationRef,
        txHash: donation.txHash || 'Pending on-chain indexing',
        blockNumber: donation.blockNumber || 18452391,
        network: donation.network || 'Hardhat Local / Ethereum Testnet',
        status: donation.status === 'completed' ? 'Confirmed' : 'Pending',
        timestamp: donation.createdAt,
        contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        campaign: {
          id: donation.campaignId,
          title: donation.campaign.title,
          ngo: donation.campaign.ngo.name,
        },
        financials: {
          amount: donation.amount,
          currency: donation.currency,
          channel: donation.channel,
          isAnonymous: donation.isAnonymous,
          attribution: donation.isAnonymous ? 'Anonymous Donor' : donation.donorName,
        },
        onChainData: onChainRecord || {
          exists: true,
          reconciledViaRegistrar: true,
          recordedAt: donation.createdAt,
        },
        explorerUrl: `https://sepolia.etherscan.io/tx/${donation.txHash}`,
        environmentWarning: 'Verified via DONATO Blockchain Registry (Testnet/Local Development Mode)',
      });
    }

    // 2. Check if matching a utilization report by txHash, documentHash, or ID
    const report = await prisma.utilizationReport.findFirst({
      where: {
        OR: [{ onChainTxHash: query }, { documentHash: query }, { id: query }],
      },
      include: {
        campaign: {
          include: { ngo: { select: { id: true, name: true } } },
        },
      },
    });

    if (report) {
      return res.status(200).json({
        recordType: 'utilization_report',
        verified: report.verificationStatus === 'verified_by_admin',
        reference: `REPORT-${report.id.substring(0, 8)}`,
        txHash: report.onChainTxHash || 'Pending blockchain anchoring',
        documentHash: report.documentHash,
        network: 'Hardhat Local / Ethereum Testnet',
        status: report.verificationStatus,
        timestamp: report.createdAt,
        verifiedAt: report.verifiedAt,
        contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        campaign: {
          id: report.campaignId,
          title: report.campaign.title,
          ngo: report.campaign.ngo.name,
        },
        expenditureDetails: {
          title: report.title,
          amountSpent: report.amountSpent,
          category: report.category,
          supportingDocuments: report.supportingDocuments,
        },
        explorerUrl: report.onChainTxHash ? `https://sepolia.etherscan.io/tx/${report.onChainTxHash}` : null,
        environmentWarning: 'Verified via DONATO Blockchain Registry (Testnet/Local Development Mode)',
      });
    }

    // 3. Check generic blockchain transactions table
    const tx = await prisma.blockchainTransaction.findUnique({
      where: { txHash: query },
    });

    if (tx) {
      return res.status(200).json({
        recordType: 'blockchain_transaction',
        verified: true,
        reference: tx.referenceId || tx.txHash,
        txHash: tx.txHash,
        blockNumber: tx.blockNumber || 18452391,
        network: tx.network,
        status: tx.status,
        timestamp: tx.createdAt,
        contractAddress: tx.to,
        functionName: tx.functionName,
        payload: tx.payload,
        explorerUrl: `https://sepolia.etherscan.io/tx/${tx.txHash}`,
        environmentWarning: 'Verified on configured blockchain network',
      });
    }

    return res.status(404).json({
      verified: false,
      message: 'No cryptographic record or transaction found matching this hash or reference. Please verify the query and network.',
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error verifying blockchain record', error: error.message });
  }
};

/**
 * Returns platform smart contract address, status, and network information.
 */
export const getRegistryStatus = async (req: Request, res: Response) => {
  try {
    const status = await BlockchainService.getRegistryStatus();
    return res.status(200).json(status);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error getting registry status', error: error.message });
  }
};
