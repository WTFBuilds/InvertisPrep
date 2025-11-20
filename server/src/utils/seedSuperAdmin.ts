import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

// Load environment variables
dotenv.config();

const SALT_ROUNDS = 10;

// Super admin data
const superAdmin = {
  email: 'superadmin@invertis.edu.in',
  password: 'super123',
  name: 'Super Admin',
  role: 'super-admin' as const,
};

async function seedSuperAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Check if super admin already exists
    const existing = await User.findOne({ email: superAdmin.email });
    
    if (existing) {
      console.log('⚠️  Super admin already exists. Updating password...\n');
      const hashedPassword = await bcrypt.hash(superAdmin.password, SALT_ROUNDS);
      existing.password = hashedPassword;
      existing.role = 'super-admin';
      existing.isActive = true;
      await existing.save();
    } else {
      console.log('👤 Creating super admin...');
      const hashedPassword = await bcrypt.hash(superAdmin.password, SALT_ROUNDS);
      
      await User.create({
        email: superAdmin.email,
        password: hashedPassword,
        name: superAdmin.name,
        role: superAdmin.role,
        googleId: `email_${superAdmin.email}`,
        isActive: true,
        lastLogin: new Date(),
      });
      
      console.log('✅ Super admin created\n');
    }

    // Print credentials
    console.log('=' .repeat(80));
    console.log('🎉 SUPER ADMIN SEEDED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('\n📋 SUPER ADMIN CREDENTIALS:');
    console.log('┌─────────────────────────────────┬──────────────┬──────────────┐');
    console.log('│ Email                           │ Password     │ Role         │');
    console.log('├─────────────────────────────────┼──────────────┼──────────────┤');
    console.log(`│ ${superAdmin.email.padEnd(31)} │ ${superAdmin.password.padEnd(12)} │ ${superAdmin.role.padEnd(12)} │`);
    console.log('└─────────────────────────────────┴──────────────┴──────────────┘');
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Login to admin panel with these credentials');
    console.log('   3. Create departments, branches, and sessions from admin panel');
    console.log('   4. Upload PYQ papers\n');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seeding
seedSuperAdmin();
