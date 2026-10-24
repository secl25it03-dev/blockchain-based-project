import dotenv from 'dotenv';
import { prisma } from './prisma';
import { hashPassword } from './utils/auth';
import { connectDB } from './config/db';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    console.log('Clearing existing users and profiles...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.wasteLog.deleteMany();
    await prisma.monetaryDonation.deleteMany();
    await prisma.foodDonation.deleteMany();
    await prisma.vendorProfile.deleteMany();
    await prisma.restaurantProfile.deleteMany();
    await prisma.ngoProfile.deleteMany();
    await prisma.user.deleteMany();

    console.log('Hashing passwords...');
    const hashedAdminPassword = await hashPassword('admin123');
    const hashedDonorPassword = await hashPassword('donor123');
    const hashedRestaurantPassword = await hashPassword('restaurant123');
    const hashedNGOPassword = await hashPassword('ngo123');
    const hashedVendorPassword = await hashPassword('vendor123');

    console.log('Seeding Admin account...');
    await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@donato.com',
        password: hashedAdminPassword,
        role: 'admin',
        status: 'active',
      },
    });

    console.log('Seeding Donor/User account...');
    await prisma.user.create({
      data: {
        name: 'John Donor',
        email: 'donor@donato.com',
        password: hashedDonorPassword,
        role: 'donor',
        status: 'active',
      },
    });

    console.log('Seeding Restaurant account...');
    const restaurant = await prisma.user.create({
      data: {
        name: 'Pizza Palace Storefront',
        email: 'restaurant@donato.com',
        password: hashedRestaurantPassword,
        role: 'restaurant',
        status: 'active',
      },
    });

    await prisma.restaurantProfile.create({
      data: {
        userId: restaurant.id,
        licenseNo: 'LIC-777888999',
        verificationDocument: 'https://via.placeholder.com/150?text=Pizza+Palace+License',
        address: '456 Broadway Ave, New York, NY 10013',
        phone: '+1 555-0199',
        foodCategories: ['Bakery', 'Cooked Meals'],
      },
    });

    console.log('Seeding NGO Partner account...');
    const ngo = await prisma.user.create({
      data: {
        name: 'Hope Food Shelter',
        email: 'ngo@donato.com',
        password: hashedNGOPassword,
        role: 'ngo',
        status: 'active',
      },
    });

    await prisma.ngoProfile.create({
      data: {
        userId: ngo.id,
        registrationNo: 'NGO-888222333',
        verificationDocument: 'https://via.placeholder.com/150?text=Hope+Shelter+Reg',
        capacity: 'Large',
        address: '789 Elm St, Brooklyn, NY 11201',
        phone: '+1 555-0144',
      },
    });

    console.log('Seeding Logistics Vendor/Driver account...');
    const vendor = await prisma.user.create({
      data: {
        name: 'Speedy Dispatch Driver',
        email: 'vendor@donato.com',
        password: hashedVendorPassword,
        role: 'vendor',
        status: 'active',
      },
    });

    await prisma.vendorProfile.create({
      data: {
        userId: vendor.id,
        vehicleType: 'bike',
        licensePlate: 'BIKE-NYC-99',
        licenseNumber: 'DL-999888777',
        verificationDocument: 'https://via.placeholder.com/150?text=Rider+Driver+License',
        phone: '+1 555-0155',
        status: 'idle',
      },
    });

    console.log('========================================');
    console.log('Database Seeding Completed Successfully!');
    console.log('========================================');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seed();
