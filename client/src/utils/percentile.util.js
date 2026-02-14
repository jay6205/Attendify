/**
 * Percentile & Assessment Stats Utilities
 */

/**
 * Calculate percentile rank using standard academic definition.
 * Percentile = (students scoring <= studentScore / totalStudents) * 100
 * 
 * @param {number} studentScore 
 * @param {number[]} allScores - Array of all scores in the class
 * @returns {number} Percentile rounded to 1 decimal
 */
export const calculatePercentile = (studentScore, allScores) => {
    if (!allScores || allScores.length === 0) return 100;
    if (allScores.length === 1) return 100;

    const atOrBelow = allScores.filter(s => s <= studentScore).length;
    return parseFloat(((atOrBelow / allScores.length) * 100).toFixed(1));
};

/**
 * Calculate assessment-level aggregate stats.
 * 
 * @param {number[]} allScores 
 * @returns {{ highest: number, lowest: number, average: number }}
 */
export const calculateAssessmentStats = (allScores) => {
    if (!allScores || allScores.length === 0) {
        return { highest: 0, lowest: 0, average: 0 };
    }

    const highest = Math.max(...allScores);
    const lowest = Math.min(...allScores);
    const average = parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1));

    return { highest, lowest, average };
};

/**
 * Get a performance badge based on percentile.
 * 
 * @param {number} percentile 
 * @returns {{ label: string, color: string, bg: string }}
 */
export const getPerformanceBadge = (percentile) => {
    if (percentile >= 90) {
        return { label: 'Top 10%', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }
    if (percentile >= 75) {
        return { label: 'Top 25%', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    }
    if (percentile >= 50) {
        return { label: 'Above Avg', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' };
    }
    if (percentile >= 25) {
        return { label: 'Below Avg', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    return { label: 'Needs Work', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
};
