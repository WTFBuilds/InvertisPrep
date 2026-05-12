import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Find user
    const user = await User.findOne({ email: 'superadmin@invertis.edu.in' });
    console.log('👤 User (without password):', JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      hasPasswordField: 'password' in user
    }, null, 2));

    // Find user WITH password
    const userWithPassword = await User.findOne({ email: 'superadmin@invertis.edu.in' }).select('+password');
    console.log('\n👤 User (with password):', JSON.stringify({
      email: userWithPassword.email,
      name: userWithPassword.name,
      role: userWithPassword.role,
      passwordField: userWithPassword.password ? '✓ Password hash exists' : '✗ No password',
      passwordLength: userWithPassword.password ? userWithPassword.password.length : 0
    }, null, 2));

    // Test password comparison
    if (userWithPassword.password) {
      console.log('\n🔑 Testing password comparison...');
      const isValid = await bcrypt.compare('super123', userWithPassword.password);
      console.log('   Result:', isValid ? '✓ Password matches' : '✗ Password does not match');
    }

    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

testUser();
