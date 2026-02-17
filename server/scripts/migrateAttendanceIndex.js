/**
 * One-time script to migrate the attendance unique index.
 * Drops the old { student, course, date } index and creates { student, course, date, startTime }.
 * 
 * Run once: node scripts/migrateAttendanceIndex.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not set in .env — cannot run migration');
    process.exit(1);
}

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (e) {
        console.error('❌ Failed to connect to MongoDB:', e.message);
        process.exit(1);
    }

    const collection = mongoose.connection.collection('attendances');

    // Drop old index
    try {
        await collection.dropIndex('student_1_course_1_date_1');
        console.log('✅ Old index (student_1_course_1_date_1) dropped');
    } catch (e) {
        console.log('ℹ️  Old index not found (already dropped or never existed):', e.message);
    }

    // Create new index
    try {
        await collection.createIndex(
            { student: 1, course: 1, date: 1, startTime: 1 },
            { unique: true }
        );
        console.log('✅ New index (student_1_course_1_date_1_startTime_1) created');
    } catch (e) {
        console.error('❌ Index creation failed:', e.message);
        await mongoose.disconnect();
        process.exit(1);
    }

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
}

migrate();
