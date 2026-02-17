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

async function migrate() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

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
        console.log('⚠️  Index creation error:', e.message);
    }

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
}

migrate();
