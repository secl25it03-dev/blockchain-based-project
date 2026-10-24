const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonatoDonationRegistry Smart Contract", function () {
  let registry;
  let admin, registrar, ngoWallet, donor1, donor2, unauthorizedUser;
  const campaignId1 = ethers.id("CAMPAIGN-001");
  const campaignId2 = ethers.id("CAMPAIGN-002");
  const donationRef1 = "DON-2026-REF-001";
  const donationRef2 = "DON-2026-REF-002";

  beforeEach(async function () {
    [admin, registrar, ngoWallet, donor1, donor2, unauthorizedUser] = await ethers.getSigners();

    const DonatoDonationRegistry = await ethers.getContractFactory("DonatoDonationRegistry");
    registry = await DonatoDonationRegistry.deploy(admin.address, registrar.address);
    await registry.waitForDeployment();
  });

  describe("Deployment & Access Control", function () {
    it("should set deployer as DEFAULT_ADMIN_ROLE and registrar as REGISTRAR_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();
      const REGISTRAR_ROLE = await registry.REGISTRAR_ROLE();

      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await registry.hasRole(REGISTRAR_ROLE, registrar.address)).to.be.true;
      expect(await registry.hasRole(REGISTRAR_ROLE, unauthorizedUser.address)).to.be.false;
    });
  });

  describe("Campaign Registration", function () {
    it("should allow REGISTRAR_ROLE to register an approved campaign", async function () {
      const targetAmount = ethers.parseEther("5.0");
      const metadataUri = "ipfs://QmTestCampaignMetadataUri";

      await expect(
        registry.connect(registrar).registerCampaign(campaignId1, ngoWallet.address, targetAmount, metadataUri)
      )
        .to.emit(registry, "CampaignRegistered")
        .withArgs(campaignId1, ngoWallet.address, targetAmount, metadataUri, (val) => val > 0);

      const campaign = await registry.getCampaign(campaignId1);
      expect(campaign.exists).to.be.true;
      expect(campaign.ngoWallet).to.equal(ngoWallet.address);
      expect(campaign.targetAmount).to.equal(targetAmount);
      expect(campaign.totalRaised).to.equal(0);
      expect(campaign.donationCount).to.equal(0);
      expect(campaign.status).to.equal(1); // Active
    });

    it("should reject campaign registration from unauthorized accounts", async function () {
      const targetAmount = ethers.parseEther("1.0");
      await expect(
        registry.connect(unauthorizedUser).registerCampaign(campaignId1, ngoWallet.address, targetAmount, "uri")
      ).to.be.reverted;
    });

    it("should prevent duplicate campaign registration", async function () {
      const targetAmount = ethers.parseEther("2.0");
      await registry.connect(registrar).registerCampaign(campaignId1, ngoWallet.address, targetAmount, "uri1");

      await expect(
        registry.connect(registrar).registerCampaign(campaignId1, ngoWallet.address, targetAmount, "uri2")
      ).to.be.revertedWith("Campaign already registered");
    });

    it("should reject registration with zero target or zero address", async function () {
      await expect(
        registry.connect(registrar).registerCampaign(campaignId1, ethers.ZeroAddress, ethers.parseEther("1"), "uri")
      ).to.be.revertedWith("Invalid NGO wallet address");

      await expect(
        registry.connect(registrar).registerCampaign(campaignId1, ngoWallet.address, 0, "uri")
      ).to.be.revertedWith("Target amount must be > 0");
    });
  });

  describe("Donation Recording — Native Crypto (ETH)", function () {
    beforeEach(async function () {
      await registry.connect(registrar).registerCampaign(
        campaignId1,
        ngoWallet.address,
        ethers.parseEther("10.0"),
        "ipfs://QmCampaign1"
      );
    });

    it("should accept native ETH donation, forward funds to NGO wallet, and emit event", async function () {
      const donationAmount = ethers.parseEther("1.5");
      const ngoInitialBalance = await ethers.provider.getBalance(ngoWallet.address);

      const tx = await registry.connect(donor1).recordNativeDonation(campaignId1, donationRef1, {
        value: donationAmount,
      });

      await expect(tx)
        .to.emit(registry, "DonationRecorded")
        .withArgs(donationRef1, campaignId1, donor1.address, donationAmount, "ETH", true, (val) => val > 0);

      const ngoFinalBalance = await ethers.provider.getBalance(ngoWallet.address);
      expect(ngoFinalBalance - ngoInitialBalance).to.equal(donationAmount);

      const record = await registry.getDonationRecord(donationRef1);
      expect(record.exists).to.be.true;
      expect(record.donorAddress).to.equal(donor1.address);
      expect(record.amount).to.equal(donationAmount);
      expect(record.currency).to.equal("ETH");
      expect(record.isNativeCrypto).to.be.true;

      const campaign = await registry.getCampaign(campaignId1);
      expect(campaign.totalRaised).to.equal(donationAmount);
      expect(campaign.donationCount).to.equal(1);
    });

    it("should reject native donation with 0 ETH value", async function () {
      await expect(
        registry.connect(donor1).recordNativeDonation(campaignId1, donationRef1, { value: 0 })
      ).to.be.revertedWith("Donation amount must be > 0");
    });

    it("should reject duplicate donation reference", async function () {
      const amount = ethers.parseEther("0.1");
      await registry.connect(donor1).recordNativeDonation(campaignId1, donationRef1, { value: amount });

      await expect(
        registry.connect(donor2).recordNativeDonation(campaignId1, donationRef1, { value: amount })
      ).to.be.revertedWith("Donation reference already recorded");
    });

    it("should reject donation to non-existent campaign", async function () {
      const nonExistentCampaign = ethers.id("DOES_NOT_EXIST");
      await expect(
        registry.connect(donor1).recordNativeDonation(nonExistentCampaign, "REF-FAIL", { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign does not exist");
    });
  });

  describe("Donation Recording — Off-chain Reconciled (Fiat/Gateway/Sandbox)", function () {
    beforeEach(async function () {
      await registry.connect(registrar).registerCampaign(
        campaignId1,
        ngoWallet.address,
        ethers.parseEther("10000"),
        "uri"
      );
    });

    it("should allow REGISTRAR_ROLE to record verified off-chain payment", async function () {
      const fiatAmount = 25000; // e.g., $250.00 represented in cents or integer units
      await expect(
        registry
          .connect(registrar)
          .recordReconciledDonation(campaignId1, donationRef2, donor2.address, fiatAmount, "USD")
      )
        .to.emit(registry, "DonationRecorded")
        .withArgs(donationRef2, campaignId1, donor2.address, fiatAmount, "USD", false, (val) => val > 0);

      const record = await registry.getDonationRecord(donationRef2);
      expect(record.exists).to.be.true;
      expect(record.donorAddress).to.equal(donor2.address);
      expect(record.amount).to.equal(fiatAmount);
      expect(record.currency).to.equal("USD");
      expect(record.isNativeCrypto).to.be.false;
    });

    it("should reject reconciled donation from unauthorized caller", async function () {
      await expect(
        registry
          .connect(unauthorizedUser)
          .recordReconciledDonation(campaignId1, donationRef2, donor2.address, 100, "USD")
      ).to.be.reverted;
    });
  });

  describe("Transparent Utilization Reports Anchoring", function () {
    const reportHash = ethers.id("INVOICE_REPORT_SHA256_HASH_OCT2026");

    beforeEach(async function () {
      await registry.connect(registrar).registerCampaign(
        campaignId1,
        ngoWallet.address,
        ethers.parseEther("5.0"),
        "uri"
      );
    });

    it("should allow verified NGO wallet to anchor a utilization report hash", async function () {
      const amountSpent = ethers.parseEther("1.2");
      const category = "Rice & Food Supplies";
      const reportUri = "ipfs://QmReportHashData";

      await expect(
        registry.connect(ngoWallet).anchorUtilizationReport(campaignId1, reportHash, amountSpent, category, reportUri)
      )
        .to.emit(registry, "UtilizationReportAnchored")
        .withArgs(campaignId1, reportHash, ngoWallet.address, amountSpent, category, reportUri, (val) => val > 0);

      const verification = await registry.verifyReport(campaignId1, reportHash);
      expect(verification.exists).to.be.true;
      expect(verification.submitter).to.equal(ngoWallet.address);
      expect(verification.amountSpent).to.equal(amountSpent);
      expect(verification.category).to.equal(category);
    });

    it("should allow REGISTRAR_ROLE to anchor an admin-verified report", async function () {
      await expect(
        registry
          .connect(registrar)
          .anchorUtilizationReport(campaignId1, reportHash, 5000, "Logistics", "ipfs://metadata")
      ).to.emit(registry, "UtilizationReportAnchored");
    });

    it("should reject report anchoring from an unauthorized third party", async function () {
      await expect(
        registry
          .connect(unauthorizedUser)
          .anchorUtilizationReport(campaignId1, reportHash, 1000, "Fake Category", "uri")
      ).to.be.revertedWith("Caller not authorized to report for this campaign");
    });

    it("should reject duplicate anchoring of the same report hash", async function () {
      await registry.connect(ngoWallet).anchorUtilizationReport(campaignId1, reportHash, 1000, "Cat1", "uri1");
      await expect(
        registry.connect(ngoWallet).anchorUtilizationReport(campaignId1, reportHash, 2000, "Cat2", "uri2")
      ).to.be.revertedWith("Report hash already anchored");
    });
  });

  describe("Emergency Pause Controls", function () {
    it("should allow DEFAULT_ADMIN_ROLE to pause and unpause the contract", async function () {
      await registry.connect(admin).pause();
      expect(await registry.paused()).to.be.true;

      await expect(
        registry
          .connect(registrar)
          .registerCampaign(campaignId1, ngoWallet.address, ethers.parseEther("1.0"), "uri")
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");

      await registry.connect(admin).unpause();
      expect(await registry.paused()).to.be.false;

      await expect(
        registry
          .connect(registrar)
          .registerCampaign(campaignId1, ngoWallet.address, ethers.parseEther("1.0"), "uri")
      ).to.emit(registry, "CampaignRegistered");
    });

    it("should prevent non-admin from pausing", async function () {
      await expect(registry.connect(unauthorizedUser).pause()).to.be.reverted;
    });
  });
});
