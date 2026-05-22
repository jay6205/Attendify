/**
 * seedDemoAccounts.js
 * 
 * Creates demo accounts for recruiter evaluation.
 * Idempotent — safe to run multiple times (skips existing accounts).
 * 
 * Usage:
 *   cd server
 *   node scripts/seedDemoAccounts.js
 * 
 * Requires: MONGO_URI in server/.env
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

dotenv.config();

const DEMO_ORG_NAME = 'Demo University';
const DEMO_ORG_CODE = 'DEMO';

const DEMO_ACCOUNTS = [
    {
        name: 'Demo Student',
        email: 'student@demo.com',
        password: 'demo123',
        role: 'student',
    },
    {
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: 'demo123',
        role: 'admin',
    },
];

const seed = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.\n');

        // 1. Find or create the demo organization
        let org = await Organization.findOne({ code: DEMO_ORG_CODE });

        if (!org) {
            org = await Organization.create({
                name: DEMO_ORG_NAME,
                code: DEMO_ORG_CODE,
                isActive: true,
                createdBy: 'seed-script',
            });
            console.log(`🏫 Created organization: ${DEMO_ORG_NAME} (Code: ${DEMO_ORG_CODE})`);
        } else {
            console.log(`🏫 Organization already exists: ${org.name} (Code: ${org.code})`);
        }

        // 2. Create each demo account
        for (const account of DEMO_ACCOUNTS) {
            const existing = await User.findOne({ email: account.email });

            if (existing) {
                console.log(`⏭️  Skipped (already exists): ${account.email} [${account.role}]`);
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(account.password, salt);

            await User.create({
                name: account.name,
                email: account.email,
                passwordHash: hashedPassword,
                role: account.role,
                organization: org._id,
                isActive: true,
            });

            console.log(`✅ Created: ${account.email} [${account.role}] (password: ${account.password})`);
        }

        console.log('\n🎉 Demo account seeding complete!');
        console.log('\n📝 Demo Credentials:');
        console.log('   Student → student@demo.com / demo123');
        console.log('   Admin   → admin@demo.com / demo123');
        console.log(`   Org Code: ${DEMO_ORG_CODE}`);

    } catch (error) {
        console.error('❌ Seed error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB.');
        process.exit(0);
    }
};

seed();
