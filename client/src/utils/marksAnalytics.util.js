/**
 * Transforms raw assessment data into comparison trend data
 * 
 * @param {Array} assessments - Array of assessment objects from API
 * @param {string} studentId - (Optional) Student ID to filter marks if raw data contains all marks. 
 *                             If data is from getMyMarks, this is not needed as obtained is direct.
 * @returns {Array} - Sorted array of data points for the chart
 */
export const buildStudentVsClassTrendData = (assessments, studentId = null) => {
    if (!assessments || !Array.isArray(assessments)) return [];

    const data = assessments.map(a => {
        let studentObtained = a.obtained; // Default for 'getMyMarks' format
        
        // Handle teacher view format where a.marks might exist
        if (studentId && a.marks && Array.isArray(a.marks)) {
            const studentMark = a.marks.find(m => m.student._id === studentId);
            studentObtained = studentMark ? studentMark.obtainedMarks : null;
        }

        // Skip if student has no mark
        if (studentObtained === null || studentObtained === undefined) return null;

        const max = a.max || a.maxMarks;
        if (!max || max === 0) return null;

        const studentPercentage = Math.round((studentObtained / max) * 100);
        
        // Class average handling
        // Case 1: Pre-calculated from backend (getMyMarks)
        let classAvgPct = a.classAveragePercentage;

        // Case 2: Calculate from raw marks array (Teacher view)
        if (classAvgPct === undefined && a.marks && Array.isArray(a.marks)) {
            const total = a.marks.reduce((sum, m) => sum + m.obtainedMarks, 0);
            const count = a.marks.length;
            if (count > 0) {
                const avg = total / count;
                classAvgPct = Math.round((avg / max) * 100);
            }
        }

        if (classAvgPct === undefined || classAvgPct === null) return null;

        return {
            name: a.title,
            date: a.date,
            studentPercentage,
            classAveragePercentage: classAvgPct,
            raw: {
                student: studentObtained,
                avg: classAvgPct, // approximate
                max
            }
        };
    }).filter(item => item !== null);

    // Sort by date chronological
    return data.sort((a, b) => new Date(a.date) - new Date(b.date));
};
