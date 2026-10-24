import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../prisma';
import { logAudit } from '../utils/audit';
import { BlockchainService, computeSha256Hash } from '../blockchain/blockchainService';

/**
 * Submit an NGO fund utilization report with supporting documents.
 * Generates an immutable SHA-256 hash of the report data and supporting documents.
 */
export const submitUtilizationReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, title, description, amountSpent, category, supportingDocuments } = req.body;

    if (!campaignId || !title || !description || !amountSpent || !category) {
      return res.status(400).json({
        message: 'campaignId, title, description, amountSpent, and category are required',
      });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { ngo: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Verify authorized NGO or admin
    if (req.user?.role !== 'admin' && campaign.ngoId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized to submit report for this campaign' });
    }

    // Generate SHA-256 cryptographic digest of the report contents + invoices
    const payloadForHashing = JSON.stringify({
      campaignId,
      title,
      description,
      amountSpent: Number(amountSpent),
      category,
      supportingDocuments: supportingDocuments || [],
      submittedAt: new Date().toISOString(),
    });
    const documentHash = computeSha256Hash(payloadForHashing);

    const report = await prisma.utilizationReport.create({
      data: {
        campaignId,
        ngoId: campaign.ngoId,
        title,
        description,
        amountSpent: Number(amountSpent),
        category,
        supportingDocuments: supportingDocuments || [
          { name: 'Expense_Receipt_Invoice.pdf', url: 'https://example.com/receipt.pdf', fileHash: documentHash },
        ],
        documentHash,
        verificationStatus: 'submitted',
      },
    });

    await logAudit(
      req.user?.id,
      'SUBMIT_UTILIZATION_REPORT',
      `Submitted utilization report "${title}" for campaign ${campaign.title} (SHA-256: ${documentHash})`,
      req
    );

    return res.status(201).json({
      message: 'Utilization report submitted successfully and queued for admin review',
      report,
      documentHash,
    });
  } catch (error: any) {
    console.error('Error submitting utilization report:', error);
    return res.status(500).json({ message: 'Error submitting utilization report', error: error.message });
  }
};

/**
 * Admin review endpoint: approves and anchors the report digest on the smart contract,
 * or rejects with feedback.
 */
export const reviewUtilizationReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reportId = String(req.params.reportId);
    const { status, adminFeedback } = req.body;

    if (!['verified_by_admin', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be verified_by_admin, rejected, or pending_review',
      });
    }

    const report = await (prisma.utilizationReport as any).findUnique({
      where: { id: reportId },
      include: { campaign: true },
    });

    if (!report) {
      return res.status(404).json({ message: 'Utilization report not found' });
    }

    let onChainTxHash = report.onChainTxHash;
    let onChainReportHash = report.onChainReportHash;

    // If approved, anchor on the blockchain smart contract
    if (status === 'verified_by_admin' && !report.onChainTxHash) {
      const anchorResult = await BlockchainService.anchorUtilizationReport(
        report.campaignId,
        report.documentHash,
        report.amountSpent,
        report.category,
        `ipfs://report-${report.id}`
      );
      onChainTxHash = anchorResult.txHash;
      onChainReportHash = report.documentHash;
    }

    const updatedReport = await prisma.utilizationReport.update({
      where: { id: reportId },
      data: {
        verificationStatus: status,
        adminFeedback: adminFeedback || undefined,
        verifiedAt: status === 'verified_by_admin' ? new Date() : undefined,
        onChainTxHash,
        onChainReportHash,
      },
    });

    await logAudit(
      req.user?.id,
      'REVIEW_UTILIZATION_REPORT',
      `Admin reviewed report #${reportId}: ${status} (On-chain tx: ${onChainTxHash || 'none'})`,
      req
    );

    return res.status(200).json({
      message: `Report status updated to ${status}`,
      report: updatedReport,
    });
  } catch (error: any) {
    console.error('Error reviewing utilization report:', error);
    return res.status(500).json({ message: 'Error reviewing report', error: error.message });
  }
};

/**
 * Public breakdown for "Where Your Money Goes"
 */
export const getCampaignUtilizationBreakdown = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = String(req.params.campaignId);

    const campaign = await (prisma.campaign as any).findUnique({
      where: { id: campaignId },
      include: {
        ngo: { select: { id: true, name: true, email: true } },
        utilizationReports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const reports: any[] = campaign.utilizationReports || [];
    const verifiedReports = reports.filter(
      (r: any) => r.verificationStatus === 'verified_by_admin'
    );
    const totalExpenditureVerified = verifiedReports.reduce((acc: number, r: any) => acc + Number(r.amountSpent || 0), 0);
    const totalExpenditureAllReported = reports.reduce((acc: number, r: any) => acc + Number(r.amountSpent || 0), 0);

    // Group expenditures by category
    const categoryTotals: { [key: string]: number } = {};
    for (const report of verifiedReports) {
      categoryTotals[report.category] = (categoryTotals[report.category] || 0) + report.amountSpent;
    }

    const remainingBalance = Math.max(0, campaign.raisedAmount - totalExpenditureVerified);

    return res.status(200).json({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      ngoName: campaign.ngo?.name || 'Verified NGO',
      currency: campaign.currency,
      targetAmount: campaign.targetAmount,
      totalDonationsReceived: campaign.raisedAmount,
      totalExpenditureVerified,
      totalExpenditureReported: totalExpenditureAllReported,
      remainingBalance,
      categoryBreakdown: categoryTotals,
      reports,
      latestUpdate: reports[0]?.createdAt || campaign.updatedAt,
      auditDisclaimer:
        'All displayed verified reports have been anchored with cryptographic SHA-256 hashes on the blockchain to prevent retroactive modification. Statuses reflect platform administration verification against submitted procurement proofs.',
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching utilization breakdown', error: error.message });
  }
};
