import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { Department, Branch, Session, User } from '../models/index.js';

dotenv.config();

const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Department.deleteMany({}),
      Branch.deleteMany({}),
      Session.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared\n');

    // Seed Departments
    console.log('📚 Seeding departments...');
    const departments = [
      {
        id: 'btech',
        name: 'B.Tech',
        displayName: 'Bachelor of Technology',
        icon: '🎓',
        description: 'Engineering courses covering various technical disciplines',
      },
      {
        id: 'bca',
        name: 'BCA',
        displayName: 'Bachelor of Computer Applications',
        icon: '💻',
        description: 'Comprehensive computer science and applications program',
      },
      {
        id: 'bcom',
        name: 'B.Com',
        displayName: 'Bachelor of Commerce',
        icon: '📊',
        description: 'Commerce, accounting, and business studies',
      },
      {
        id: 'bba',
        name: 'BBA',
        displayName: 'Bachelor of Business Administration',
        icon: '💼',
        description: 'Business management and administration',
      },
      {
        id: 'mtech',
        name: 'M.Tech',
        displayName: 'Master of Technology',
        icon: '🔬',
        description: 'Advanced engineering and technology programs',
      },
      {
        id: 'mba',
        name: 'MBA',
        displayName: 'Master of Business Administration',
        icon: '📈',
        description: 'Advanced business management and leadership',
      },
    ];

    await Department.insertMany(departments);
    console.log(`✅ ${departments.length} departments seeded\n`);

    // Seed Branches
    console.log('🌿 Seeding branches...');
    const branches = [
      // B.Tech branches
      { 
        id: 'cse', 
        name: 'Computer Science & Engineering', 
        departmentId: 'btech', 
        semesters: [1, 2, 3, 4, 5, 6, 7, 8] 
      },
      { 
        id: 'ece', 
        name: 'Electronics & Communication Engineering', 
        departmentId: 'btech', 
        semesters: [1, 2, 3, 4, 5, 6, 7, 8] 
      },
      { 
        id: 'me', 
        name: 'Mechanical Engineering', 
        departmentId: 'btech', 
        semesters: [1, 2, 3, 4, 5, 6, 7, 8] 
      },
      { 
        id: 'ce', 
        name: 'Civil Engineering', 
        departmentId: 'btech', 
        semesters: [1, 2, 3, 4, 5, 6, 7, 8] 
      },
      { 
        id: 'ee', 
        name: 'Electrical Engineering', 
        departmentId: 'btech', 
        semesters: [1, 2, 3, 4, 5, 6, 7, 8] 
      },
      { 
        id: 'ai', 
        name: 'Artificial Intelligence & Machine Learning', 
        departmentId: 'btech', 
        semesters: [1, 2, 3, 4, 5, 6, 7, 8] 
      },

      // Other programs (general)
      { 
        id: 'general', 
        name: 'General', 
        departmentId: 'bca', 
        semesters: [1, 2, 3, 4, 5, 6] 
      },
      { 
        id: 'general', 
        name: 'General', 
        departmentId: 'bcom', 
        semesters: [1, 2, 3, 4, 5, 6] 
      },
      { 
        id: 'general', 
        name: 'General', 
        departmentId: 'bba', 
        semesters: [1, 2, 3, 4, 5, 6] 
      },
      { 
        id: 'general', 
        name: 'General', 
        departmentId: 'mba', 
        semesters: [1, 2, 3, 4] 
      },

      // M.Tech branches
      { 
        id: 'cse', 
        name: 'Computer Science & Engineering', 
        departmentId: 'mtech', 
        semesters: [1, 2, 3, 4] 
      },
      { 
        id: 'vlsi', 
        name: 'VLSI Design', 
        departmentId: 'mtech', 
        semesters: [1, 2, 3, 4] 
      },
    ];

    await Branch.insertMany(branches);
    console.log(`✅ ${branches.length} branches seeded\n`);

    // Seed Sessions (last 5 years)
    console.log('📅 Seeding sessions...');
    const currentYear = new Date().getFullYear();
    const sessions = [];

    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      sessions.push({
        id: `${startYear}-${endYear.toString().slice(2)}`,
        name: `Academic Year ${startYear}-${endYear}`,
        startYear,
        endYear,
        isActive: i === 0, // Only current year is active
      });
    }

    await Session.insertMany(sessions);
    console.log(`✅ ${sessions.length} sessions seeded\n`);

    // Create super admin user (optional)
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@invertis.edu.in';
    const adminExists = await User.findOne({ email: superAdminEmail });

    if (!adminExists) {
      console.log('👑 Creating super admin user...');
      await User.create({
        googleId: 'super-admin-temp-id',
        email: superAdminEmail,
        name: 'Super Admin',
        role: 'super-admin',
      });
      console.log(`✅ Super admin created: ${superAdminEmail}\n`);
    } else {
      console.log(`ℹ️  Super admin already exists: ${superAdminEmail}\n`);
    }

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Departments: ${departments.length}`);
    console.log(`  - Branches: ${branches.length}`);
    console.log(`  - Sessions: ${sessions.length}`);
    console.log(`  - Super Admin: ${superAdminEmail}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
