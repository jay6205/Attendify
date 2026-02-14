import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Assessment from '../models/Assessment.js';
import AttendanceSession from '../models/AttendanceSession.js';

// @desc    Get aggregated usage metrics per organization
// @route   GET /api/v2/super-admin/metrics
// @access  Super Admin
export const getOrganizationMetrics = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch all orgs + run all aggregation pipelines in parallel
        const [
            organizations,
            userCounts,
            courseCounts,
            assessmentCounts,
            attendanceCounts,
            recentStudents,
            recentCourses,
            recentAssessments,
            lastUserActivity
        ] = await Promise.all([
            // 1. All organizations
            Organization.find().lean(),

            // 2. User counts grouped by org + role
            User.aggregate([
                { $match: { role: { $in: ['admin', 'teacher', 'student'] } } },
                { $group: {
                    _id: { org: '$organization', role: '$role' },
                    count: { $sum: 1 }
                }}
            ]),

            // 3. Course counts per org
            Course.aggregate([
                { $group: { _id: '$organization', count: { $sum: 1 } } }
            ]),

            // 4. Assessment counts per org
            Assessment.aggregate([
                { $group: { _id: '$organization', count: { $sum: 1 } } }
            ]),

            // 5. Attendance session counts per org
            AttendanceSession.aggregate([
                { $group: { _id: '$organization', count: { $sum: 1 } } }
            ]),

            // 6. Students added last 30 days per org
            User.aggregate([
                { $match: { role: 'student', createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: '$organization', count: { $sum: 1 } } }
            ]),

            // 7. Courses created last 30 days per org
            Course.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: '$organization', count: { $sum: 1 } } }
            ]),

            // 8. Assessments created last 30 days per org
            Assessment.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: '$organization', count: { $sum: 1 } } }
            ]),

            // 9. Last activity per org per role (using createdAt)
            User.aggregate([
                { $match: { role: { $in: ['admin', 'teacher', 'student'] } } },
                { $group: {
                    _id: { org: '$organization', role: '$role' },
                    lastActive: { $max: '$createdAt' }
                }}
            ])
        ]);

        // Build lookup maps for O(1) access
        const userMap = {};    // { orgId: { admin: N, teacher: N, student: N } }
        for (const item of userCounts) {
            const orgId = item._id.org?.toString();
            if (!orgId) continue;
            if (!userMap[orgId]) userMap[orgId] = { admin: 0, teacher: 0, student: 0 };
            userMap[orgId][item._id.role] = item.count;
        }

        const toMap = (arr) => {
            const m = {};
            for (const item of arr) {
                if (item._id) m[item._id.toString()] = item.count;
            }
            return m;
        };

        const courseMap = toMap(courseCounts);
        const assessmentMap = toMap(assessmentCounts);
        const attendanceMap = toMap(attendanceCounts);
        const recentStudentMap = toMap(recentStudents);
        const recentCourseMap = toMap(recentCourses);
        const recentAssessmentMap = toMap(recentAssessments);

        // Last activity map
        const activityMap = {}; // { orgId: { admin, teacher, student } }
        for (const item of lastUserActivity) {
            const orgId = item._id.org?.toString();
            if (!orgId) continue;
            if (!activityMap[orgId]) activityMap[orgId] = {};
            activityMap[orgId][item._id.role] = item.lastActive;
        }

        // Assemble final response
        const metrics = organizations.map(org => {
            const id = org._id.toString();
            const users = userMap[id] || { admin: 0, teacher: 0, student: 0 };
            const activity = activityMap[id] || {};

            return {
                organizationId: org._id,
                organizationName: org.name,
                organizationCode: org.code || null,
                isActive: org.isActive,

                users: {
                    admins: users.admin,
                    teachers: users.teacher,
                    students: users.student
                },

                academic: {
                    courses: courseMap[id] || 0,
                    assessments: assessmentMap[id] || 0,
                    attendanceSessions: attendanceMap[id] || 0
                },

                growth: {
                    studentsLast30Days: recentStudentMap[id] || 0,
                    coursesLast30Days: recentCourseMap[id] || 0,
                    assessmentsLast30Days: recentAssessmentMap[id] || 0
                },

                activity: {
                    lastAdminLogin: activity.admin || null,
                    lastTeacherAction: activity.teacher || null,
                    lastStudentAction: activity.student || null
                }
            };
        });

        res.json(metrics);
    } catch (error) {
        console.error('Metrics Error:', error);
        res.status(500).json({ message: 'Failed to fetch metrics', error: error.message });
    }
};
