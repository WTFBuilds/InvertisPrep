import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/invertisprep';

const adminUsers = [
  {
    email: 'admin@invertis.edu.in',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    email: 'superadmin@invertis.edu.in',
    password: 'super123',
    name: 'Super Admin',
    role: 'super-admin',
  },
  {
    email: 'test@invertis.edu.in',
    password: 'test123',
    name: 'Test Student',
    role: 'student',
  },
];

async function seedAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Hash passwords and create users
    for (const adminData of adminUsers) {
      const existingUser = await User.findOne({ email: adminData.email });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${adminData.email}`);
        
        // Update password if user exists
        if (!existingUser.password) {
          existingUser.password = await bcrypt.hash(adminData.password, 10);
          existingUser.role = adminData.role as any;
          await existingUser.save();
          console.log(`   ✓ Updated password for: ${adminData.email}`);
        }
        continue;
      }

      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const user = new User({
        googleId: `email_${adminData.email}`, // Unique identifier for email-based auth
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        role: adminData.role,
      });

      await user.save();
      console.log(`✅ Created ${adminData.role}: ${adminData.email} (password: ${adminData.password})`);
    }

    console.log('\n🎉 Admin seeding completed!');
    console.log('\n📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    adminUsers.forEach(admin => {
      console.log(`${admin.role.toUpperCase().padEnd(12)} | ${admin.email.padEnd(30)} | ${admin.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedAdmins();
