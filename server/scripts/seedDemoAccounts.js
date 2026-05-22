/**
 * seedDemoAccounts.js
 *
 * Creates demo accounts for recruiter evaluation.
 * Idempotent - safe to run multiple times.
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
import Semester from '../models/Semester.js';
import Course from '../models/Course.js';
import Assessment from '../models/Assessment.js';
import StudentMark from '../models/StudentMark.js';
import Attendance from '../models/Attendance.js';

dotenv.config();

const DEMO_ORG_NAME = 'Demo University';
const DEMO_ORG_CODE = 'DEMO';
const DEMO_PARENT_PHONE = '9990001234';

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
    {
        name: 'Demo Teacher',
        email: 'teacher@demo.com',
        password: 'demo123',
        role: 'teacher',
    },
    {
        name: 'Demo Parent',
        email: 'parent@demo.com',
        password: 'demo123',
        role: 'parent',
        phoneNumber: DEMO_PARENT_PHONE,
    },
];

const ensureDemoAccount = async (account, organizationId) => {
    const existing = await User.findOne({ email: account.email });

    if (existing) {
        let updated = false;

        if (existing.name !== account.name) {
            existing.name = account.name;
            updated = true;
        }

        if (existing.role !== account.role) {
            existing.role = account.role;
            updated = true;
        }

        if (!existing.organization || existing.organization.toString() !== organizationId.toString()) {
            existing.organization = organizationId;
            updated = true;
        }

        if (existing.isActive !== true) {
            existing.isActive = true;
            updated = true;
        }

        if (account.role === 'parent' && account.phoneNumber) {
            if (existing.phoneNumber !== account.phoneNumber) {
                existing.phoneNumber = account.phoneNumber;
                updated = true;
            }

            if (existing.phoneRequired !== false) {
                existing.phoneRequired = false;
                updated = true;
            }

            if (existing.phoneVerified !== true) {
                existing.phoneVerified = true;
                updated = true;
            }
        }

        if (updated) {
            await existing.save();
            console.log(`Updated existing demo account: ${account.email} [${account.role}]`);
        } else {
            console.log(`Skipped (already exists): ${account.email} [${account.role}]`);
        }

        return existing;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(account.password, salt);

    const createdUser = await User.create({
        name: account.name,
        email: account.email,
        passwordHash: hashedPassword,
        role: account.role,
        organization: organizationId,
        isActive: true,
        ...(account.role === 'parent' && account.phoneNumber
            ? {
                phoneNumber: account.phoneNumber,
                phoneRequired: false,
                phoneVerified: true,
            }
            : {}),
    });

    console.log(`Created: ${account.email} [${account.role}] (password: ${account.password})`);
    return createdUser;
};

const linkDemoParentToStudent = async (organizationId) => {
    const demoStudent = await User.findOne({ email: 'student@demo.com' }).select('_id');
    const demoParent = await User.findOne({ email: 'parent@demo.com' });

    if (!demoStudent || !demoParent) {
        console.log('Skipped parent linking because the demo student or parent account was not found.');
        return;
    }

    if (!demoParent.linkedChildren) {
        demoParent.linkedChildren = [];
    }

    const linkedChildren = demoParent.linkedChildren;
    const alreadyLinked = linkedChildren.some(
        (childId) => childId.toString() === demoStudent._id.toString()
    );

    let updated = false;

    if (!alreadyLinked) {
        demoParent.linkedChildren.push(demoStudent._id);
        updated = true;
    }

    if (!demoParent.organization || demoParent.organization.toString() !== organizationId.toString()) {
        demoParent.organization = organizationId;
        updated = true;
    }

    if (demoParent.phoneNumber !== DEMO_PARENT_PHONE) {
        demoParent.phoneNumber = DEMO_PARENT_PHONE;
        updated = true;
    }

    if (demoParent.phoneRequired !== false) {
        demoParent.phoneRequired = false;
        updated = true;
    }

    if (demoParent.phoneVerified !== true) {
        demoParent.phoneVerified = true;
        updated = true;
    }

    if (demoParent.isActive !== true) {
        demoParent.isActive = true;
        updated = true;
    }

    if (updated) {
        await demoParent.save();
        console.log('Updated demo parent account setup.');
    } else {
        console.log('Demo parent account is already linked to the demo student.');
    }
};

const seedDemoData = async (organizationId) => {
    const demoStudent = await User.findOne({ email: 'student@demo.com' });
    const demoTeacher = await User.findOne({ email: 'teacher@demo.com' });

    if (!demoStudent || !demoTeacher) {
        console.log('Skipped demo data seeding: Student or Teacher not found.');
        return;
    }

    // 1. Seed Semester
    let semester = await Semester.findOne({ organization: organizationId, name: 'Current Semester' });
    if (!semester) {
        semester = await Semester.create({
            organization: organizationId,
            name: 'Current Semester',
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)), // 2 months ago
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)), // 2 months from now
            status: 'active'
        });
        console.log('Created Demo Semester.');
    }

    // 2. Seed Course
    let course = await Course.findOne({ organization: organizationId, code: 'CS101' });
    if (!course) {
        course = await Course.create({
            organization: organizationId,
            name: 'Introduction to Computer Science',
            code: 'CS101',
            credits: 4,
            semester: semester._id,
            teacher: demoTeacher._id,
            students: [demoStudent._id]
        });
        console.log('Created Demo Course (CS101).');
    } else if (!course.students.includes(demoStudent._id)) {
        course.students.push(demoStudent._id);
        await course.save();
        console.log('Enrolled Demo Student in CS101.');
    }

    // 3. Seed Assessment
    let assessment = await Assessment.findOne({ course: course._id, title: 'Midterm Exam' });
    if (!assessment) {
        assessment = await Assessment.create({
            organization: organizationId,
            course: course._id,
            teacher: demoTeacher._id,
            title: 'Midterm Exam',
            maxMarks: 100,
            examType: 'midsem',
            date: new Date(new Date().setDate(new Date().getDate() - 10)) // 10 days ago
        });
        console.log('Created Demo Assessment (Midterm).');
    }

    // 4. Seed Marks
    const existingMark = await StudentMark.findOne({ assessment: assessment._id, student: demoStudent._id });
    if (!existingMark) {
        await StudentMark.create({
            organization: organizationId,
            assessment: assessment._id,
            student: demoStudent._id,
            course: course._id,
            obtainedMarks: 88,
            enteredBy: demoTeacher._id
        });
        console.log('Added Demo Marks for Student.');
    }

    // 5. Seed Attendance (last 5 weekdays)
    for (let i = 1; i <= 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Skip weekends
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        const dateStr = d.toISOString().split('T')[0];
        const existingAtt = await Attendance.findOne({ 
            student: demoStudent._id, 
            course: course._id, 
            date: {
                $gte: new Date(dateStr + 'T00:00:00.000Z'),
                $lt: new Date(dateStr + 'T23:59:59.999Z')
            }
        });

        if (!existingAtt) {
            await Attendance.create({
                student: demoStudent._id,
                course: course._id,
                semester: semester._id,
                date: d,
                status: i === 3 ? 'Absent' : (i === 4 ? 'Leave' : 'Present'), // 3 Present, 1 Absent, 1 Leave
                markedBy: demoTeacher._id
            });
            console.log(`Added Demo Attendance for ${dateStr}.`);
        }
    }

    // 6. Give Student some XP so the Gamification looks good
    if (!demoStudent.details) demoStudent.details = {};
    if (!demoStudent.details.xp || demoStudent.details.xp < 1200) {
        demoStudent.details.xp = 1250;
        await demoStudent.save();
        console.log('Awarded 1250 XP to Demo Student.');
    }
};

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.\n');

        let org = await Organization.findOne({ code: DEMO_ORG_CODE });

        if (!org) {
            org = await Organization.create({
                name: DEMO_ORG_NAME,
                code: DEMO_ORG_CODE,
                isActive: true,
                createdBy: 'seed-script',
            });
            console.log(`Created organization: ${DEMO_ORG_NAME} (Code: ${DEMO_ORG_CODE})`);
        } else {
            console.log(`Organization already exists: ${org.name} (Code: ${org.code})`);
        }

        for (const account of DEMO_ACCOUNTS) {
            await ensureDemoAccount(account, org._id);
        }

        await linkDemoParentToStudent(org._id);
        
        console.log('\nSeeding Demo Data (Courses, Marks, Attendance)...');
        await seedDemoData(org._id);

        console.log('\nDemo account seeding complete!');
        console.log('\nDemo Credentials:');
        console.log('   Student -> student@demo.com / demo123');
        console.log('   Teacher -> teacher@demo.com / demo123');
        console.log('   Admin   -> admin@demo.com / demo123');
        console.log('   Parent  -> parent@demo.com / demo123');
        console.log(`   Org Code: ${DEMO_ORG_CODE}`);
    } catch (error) {
        console.error('Seed error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
        process.exit(0);
    }
};

seed();
