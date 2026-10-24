import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';
import { BlockchainService } from '../blockchain/blockchainService';

describe('DONATO Backend & Blockchain API Suite', () => {
  let sampleCampaignId: string;
  let sampleDonationRef: string;
  let sampleTxHash: string;

  beforeAll(async () => {
    const campaign = await prisma.campaign.findFirst({
      where: { status: 'active' },
    });
    if (campaign) {
      sampleCampaignId = campaign.id;
    }

    const donation = await prisma.donationRecord.findFirst({
      where: { status: 'completed' },
    });
    if (donation) {
      sampleDonationRef = donation.donationRef;
      sampleTxHash = donation.txHash || '';
    }
  });

  afterAll(async () => {
    BlockchainService.cleanup();
    await prisma.$disconnect();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('Campaigns API', () => {
    it('should list all active campaigns', async () => {
      const res = await request(app).get('/api/campaigns');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('targetAmount');
    });

    it('should fetch a single campaign with transparency stats', async () => {
      if (!sampleCampaignId) return;
      const res = await request(app).get(`/api/campaigns/${sampleCampaignId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(sampleCampaignId);
      expect(res.body).toHaveProperty('transparencyStats');
      expect(res.body.transparencyStats).toHaveProperty('totalSpentVerified');
      expect(res.body.transparencyStats).toHaveProperty('remainingBalance');
    });
  });

  describe('Blockchain Verification API', () => {
    it('should return blockchain registry status and contract address', async () => {
      const res = await request(app).get('/api/blockchain/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('contractAddress');
      expect(res.body).toHaveProperty('network');
      expect(res.body).toHaveProperty('privacyEnforced', true);
    });

    it('should verify an existing donation reference', async () => {
      if (!sampleDonationRef) return;
      const res = await request(app).get(`/api/blockchain/verify?query=${sampleDonationRef}`);
      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.recordType).toBe('donation');
      expect(res.body.reference).toBe(sampleDonationRef);
      expect(res.body).toHaveProperty('contractAddress');
    });

    it('should verify an existing transaction hash', async () => {
      if (!sampleTxHash) return;
      const res = await request(app).get(`/api/blockchain/verify?query=${sampleTxHash}`);
      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.txHash).toBe(sampleTxHash);
    });

    it('should return 404 for an invalid or non-existent hash', async () => {
      const res = await request(app).get('/api/blockchain/verify?query=0x0000000000000000000000000000000000000000000000000000000000000000');
      expect(res.status).toBe(404);
      expect(res.body.verified).toBe(false);
    });
  });

  describe('Donation & Reconciliation Flow', () => {
    let testDonationRef: string;
    let testPaymentId: string;

    it('should initiate a donation session in sandbox mode', async () => {
      if (!sampleCampaignId) return;
      const res = await request(app)
        .post('/api/donations/initiate')
        .send({
          campaignId: sampleCampaignId,
          amount: 50,
          currency: 'USD',
          donorName: 'Test Donor',
          isAnonymous: false,
          paymentGateway: 'mock_sandbox',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('donationRef');
      expect(res.body).toHaveProperty('paymentId');
      testDonationRef = res.body.donationRef;
      testPaymentId = res.body.paymentId;
    });

    it('should reconcile payment and anchor on blockchain', async () => {
      if (!testDonationRef || !testPaymentId) return;
      const res = await request(app)
        .post('/api/donations/reconcile')
        .send({
          donationRef: testDonationRef,
          paymentId: testPaymentId,
          status: 'completed',
        });

      expect(res.status).toBe(200);
      expect(res.body.donation.status).toBe('completed');
      expect(res.body.donation.txHash).toBeDefined();
      expect(res.body.donation.verifiedOnChain).toBe(true);
    });

    it('should prevent duplicate payment processing via idempotency check', async () => {
      if (!testDonationRef || !testPaymentId) return;
      const res = await request(app)
        .post('/api/donations/reconcile')
        .send({
          donationRef: testDonationRef,
          paymentId: testPaymentId,
          status: 'completed',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('already successfully processed');
      expect(res.body.donation.donationRef).toBe(testDonationRef);
    });

    it('should retrieve a digital receipt for the completed donation', async () => {
      if (!testDonationRef) return;
      const res = await request(app).get(`/api/donations/receipt/${testDonationRef}`);
      expect(res.status).toBe(200);
      expect(res.body.donationRef).toBe(testDonationRef);
      expect(res.body).toHaveProperty('digitalFingerprint');
      expect(res.body.verifiedOnChain).toBe(true);
    });
  });

  describe('Fund Utilization API', () => {
    it('should retrieve breakdown for "Where Your Money Goes"', async () => {
      if (!sampleCampaignId) return;
      const res = await request(app).get(`/api/utilization/campaign/${sampleCampaignId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalExpenditureVerified');
      expect(res.body).toHaveProperty('remainingBalance');
      expect(res.body).toHaveProperty('categoryBreakdown');
      expect(res.body).toHaveProperty('auditDisclaimer');
    });
  });
});
