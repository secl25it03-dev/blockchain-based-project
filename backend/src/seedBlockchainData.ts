import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { computeSha256Hash } from './blockchain/blockchainService';

async function seed() {
  console.log('--- Starting DONATO Blockchain Platform Seeding ---');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@donato.org' },
    update: {},
    create: {
      name: 'DONATO Platform Admin',
      email: 'admin@donato.org',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    },
  });
  console.log('Admin ready:', admin.email);

  // 2. Verified NGOs
  const ngo1 = await prisma.user.upsert({
    where: { email: 'hope@orphanage.org' },
    update: {},
    create: {
      name: 'Hope Foundation & Orphanage Care',
      email: 'hope@orphanage.org',
      password: hashedPassword,
      role: 'ngo',
      status: 'active',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      ngoProfile: {
        create: {
          registrationNo: 'NGO-DELHI-88219/2020',
          verificationDocument: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          capacity: '120 children & adolescents',
          address: '42 Lotus Enclave, South Delhi, India',
          phone: '+91 98765 43210',
          walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          mission: 'Providing food, shelter, education and health care to vulnerable orphaned children.',
        },
      },
    },
  });

  const ngo2 = await prisma.user.upsert({
    where: { email: 'relief@disasterresponse.org' },
    update: {},
    create: {
      name: 'Asha Community Food & Relief Mission',
      email: 'relief@disasterresponse.org',
      password: hashedPassword,
      role: 'ngo',
      status: 'active',
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      ngoProfile: {
        create: {
          registrationNo: 'NGO-MUM-44120/2019',
          verificationDocument: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
          capacity: '500+ daily beneficiaries',
          address: '18 Marine Lines Industrial Ward, Mumbai, India',
          phone: '+91 91234 56789',
          walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          mission: 'Fast-response humanitarian food relief and medical aid.',
        },
      },
    },
  });

  // Pending NGO for admin approval demo
  const pendingNgo = await prisma.user.upsert({
    where: { email: 'shelter@futuregen.org' },
    update: {},
    create: {
      name: 'FutureGen Youth Shelter Society',
      email: 'shelter@futuregen.org',
      password: hashedPassword,
      role: 'ngo',
      status: 'pending_approval',
      walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      ngoProfile: {
        create: {
          registrationNo: 'NGO-BANGALORE-99120/2025',
          verificationDocument: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
          capacity: '80 youths',
          address: '89 Indiranagar 100ft Road, Bangalore, India',
          phone: '+91 94444 12345',
          walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
          mission: 'Empowering runaway and underprivileged youth with technical vocational skills.',
        },
      },
    },
  });
  console.log('NGOs configured (Active & Pending).');

  // 3. Demo Donor
  const donor = await prisma.user.upsert({
    where: { email: 'donor@donato.org' },
    update: {},
    create: {
      name: 'Sarah Jenkins',
      email: 'donor@donato.org',
      password: hashedPassword,
      role: 'donor',
      status: 'active',
      walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    },
  });

  // 4. Campaigns
  const existingCampaigns = await prisma.campaign.findMany();
  if (existingCampaigns.length === 0) {
    const c1 = await prisma.campaign.create({
      data: {
        ngoId: ngo1.id,
        title: 'Nutritious Daily Meals for 120 Orphaned Children',
        description:
          'Ensure 120 children at Hope Orphanage receive balanced, high-protein daily meals, fruits, and vitamins for the next 6 months. Every procurement receipt is published with cryptographic verification on Ethereum.',
        beneficiaryStory:
          'Children aged 4 to 17 who have lost parental care. Proper nutrition directly enhances their cognitive growth, classroom attendance, and immune resistance.',
        category: 'orphanage_care',
        targetAmount: 12000,
        raisedAmount: 7450,
        currency: 'USD',
        bannerImage:
          'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
        status: 'active',
        onChainCampaignId: '0x' + '11'.repeat(32),
      },
    });

    const c2 = await prisma.campaign.create({
      data: {
        ngoId: ngo2.id,
        title: 'Emergency Flood Relief Food & Safe Water Dispatch',
        description:
          'Immediate mobilization of dry ration ration kits, water filtration tablets, and emergency baby formula packets to families stranded by recent monsoon flooding.',
        beneficiaryStory:
          'Over 350 families in submerged coastal settlements currently cut off from basic supply routes and potable drinking water.',
        category: 'disaster_relief',
        targetAmount: 25000,
        raisedAmount: 18200,
        currency: 'USD',
        bannerImage:
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
        status: 'active',
        onChainCampaignId: '0x' + '22'.repeat(32),
      },
    });

    const c3 = await prisma.campaign.create({
      data: {
        ngoId: ngo1.id,
        title: 'School Supply Kits & Digital Learning Lab',
        description:
          'Procuring 120 personalized school kits (books, geometry sets, backpacks) and 8 refurbished laptops for the orphanage communal homework room.',
        beneficiaryStory:
          'First-generation students striving to bridge the digital divide and gain computer literacy.',
        category: 'education',
        targetAmount: 8000,
        raisedAmount: 3100,
        currency: 'USD',
        bannerImage:
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
        status: 'active',
        onChainCampaignId: '0x' + '33'.repeat(32),
      },
    });
    console.log('Campaigns created.');

    // 5. Utilization Reports with SHA-256 Hashes
    const invoice1Data = JSON.stringify({
      vendor: 'Kisan Agro Grain Wholesale Co.',
      items: ['Rice 600kg', 'Toor Dal 250kg', 'Sunflower Oil 80L'],
      invoiceNo: 'KAG-2026-904',
      date: '2026-10-12',
      amount: 1850,
    });
    const hash1 = computeSha256Hash(invoice1Data);

    await prisma.utilizationReport.create({
      data: {
        campaignId: c1.id,
        ngoId: ngo1.id,
        title: 'Bulk Grains, Lentils & Cooking Oil Procurement',
        description:
          'Purchased 600kg of certified grain staples and cooking oil to secure balanced meals for Q4. Direct wholesale purchase receipt attached.',
        amountSpent: 1850,
        category: 'Staple Food Supply',
        supportingDocuments: [
          {
            name: 'Kisan_Wholesale_Invoice_Receipt.pdf',
            url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
            fileHash: hash1,
          },
        ],
        documentHash: hash1,
        onChainReportHash: hash1,
        onChainTxHash: '0x7e4a8f9c1b3d5e2a4f6d8c0b2e4a6f8d0c2e4a6f8d0c2e4a6f8d0c2e4a6f8d0c',
        verificationStatus: 'verified_by_admin',
        verifiedAt: new Date(Date.now() - 86400000 * 5),
      },
    });

    const invoice2Data = JSON.stringify({
      vendor: 'Mother Dairy & Fresh Produce Depot',
      items: ['Daily Cow Milk 30L/day for 30 days', 'Seasonal Fresh Fruits'],
      invoiceNo: 'MD-2026-0041',
      date: '2026-10-18',
      amount: 920,
    });
    const hash2 = computeSha256Hash(invoice2Data);

    await prisma.utilizationReport.create({
      data: {
        campaignId: c1.id,
        ngoId: ngo1.id,
        title: 'Monthly Fresh Milk & Seasonal Fruit Supply',
        description:
          'Procured 900 liters of pasteurized milk and bananas/apples for growing children morning breakfast.',
        amountSpent: 920,
        category: 'Fresh Dairy & Nutrition',
        supportingDocuments: [
          {
            name: 'Mother_Dairy_Contract_Receipt.pdf',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
            fileHash: hash2,
          },
        ],
        documentHash: hash2,
        onChainReportHash: hash2,
        onChainTxHash: '0x3d5e2a4f6d8c0b2e4a6f8d0c2e4a6f8d0c2e4a6f8d0c2e4a6f8d0c2e4a6f8d0c',
        verificationStatus: 'verified_by_admin',
        verifiedAt: new Date(Date.now() - 86400000 * 2),
      },
    });

    // Pending Report
    const pendingInvoice = JSON.stringify({
      vendor: 'CareWell Pediatric Clinic',
      service: 'Biannual health checkups & deworming',
      amount: 450,
    });
    const pendingHash = computeSha256Hash(pendingInvoice);

    await prisma.utilizationReport.create({
      data: {
        campaignId: c1.id,
        ngoId: ngo1.id,
        title: 'Biannual Pediatric Health & Dental Screenings',
        description:
          'Conducted full health screenings, BMI check, and dental hygiene checkups for all 120 children.',
        amountSpent: 450,
        category: 'Medical & Pediatric Care',
        supportingDocuments: [
          {
            name: 'CareWell_Clinic_Invoice_Draft.pdf',
            url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
            fileHash: pendingHash,
          },
        ],
        documentHash: pendingHash,
        verificationStatus: 'pending_review',
      },
    });
    console.log('Transparent Utilization Reports seeded.');

    // 6. Donations
    await prisma.donationRecord.create({
      data: {
        donationRef: 'DON-2026-881902',
        campaignId: c1.id,
        donorId: donor.id,
        donorName: 'Sarah Jenkins',
        isAnonymous: false,
        amount: 250,
        currency: 'USD',
        channel: 'fiat_gateway',
        paymentGateway: 'mock_sandbox',
        paymentId: 'pay_mock_992817203',
        status: 'completed',
        txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        blockNumber: 18452395,
        network: 'Hardhat Local / Ethereum Testnet',
        verifiedOnChain: true,
      },
    });

    await prisma.donationRecord.create({
      data: {
        donationRef: 'DON-WEB3-2026-119283',
        campaignId: c1.id,
        donorId: donor.id,
        donorWallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        donorName: 'Anonymous Web3 Donor',
        isAnonymous: true,
        amount: 0.5,
        currency: 'ETH',
        channel: 'crypto_web3',
        paymentGateway: 'crypto_metamask',
        paymentId: '0x5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
        status: 'completed',
        txHash: '0x5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
        blockNumber: 18452410,
        network: 'Hardhat Local / Ethereum Testnet',
        verifiedOnChain: true,
      },
    });
    console.log('Donation records seeded.');
  }

  console.log('--- DONATO Blockchain Platform Seeding Completed Successfully ---');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
