import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';

/**
 * Computes the deterministic attendance truth for a student.
 * @param {string} userId - The student's user ID
 * @returns {Promise<Object>} Truth Object with stats and status
 */
export const computeStudentAttendanceTruth = async (userId) => {
    try {
        // 1. Fetch Enrolled Courses
        const courses = await Course.find({ students: userId });
        
        if (!courses || courses.length === 0) {
            return {
                enrolledCourses: 0,
                attendancePercent: 0,
                status: "NO_ENROLLMENT",
                details: []
            };
        }

        const courseIds = courses.map(c => c._id);

        // 2. Fetch Attendance Records
        const attendanceRecords = await Attendance.find({ 
            student: userId,
            course: { $in: courseIds }
        });

        // 3. Compute Stats
        let totalClasses = 0;
        let totalPresent = 0;
        let criticalCourses = 0;

        const details = courses.map(course => {
            const courseAtt = attendanceRecords.filter(a => a.course.toString() === course._id.toString());
            const total = courseAtt.length;
            const present = courseAtt.filter(a => a.status === 'Present').length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0; // Default to 0 if no classes
            
            // Per-course status
            let status = "SAFE";
            if (percentage < 75) status = "WARNING";
            if (percentage < 60) status = "CRITICAL";

            if (status !== "SAFE") criticalCourses++;

            totalClasses += total;
            totalPresent += present;

            return {
                courseName: course.name,
                courseCode: course.code,
                total,
                present,
                percentage,
                status
            };
        });

        const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
        
        // Overall Status
        let overallStatus = "SAFE";
        if (overallPercentage < 75 || criticalCourses > 0) overallStatus = "WARNING";
        if (overallPercentage < 60) overallStatus = "CRITICAL";

        return {
            enrolledCourses: courses.length,
            attendancePercent: overallPercentage,
            institutionalTarget: 75, // Hardcoded V2 Rule
            deficitClasses: 0, // Placeholder for advanced calculation if needed
            status: overallStatus,
            details: details
        };

    } catch (error) {
        console.error("Attendance Truth Service Error:", error);
        throw new Error("Failed to compute attendance truth");
    }
};
