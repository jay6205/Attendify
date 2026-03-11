/**
 * Calculates the current attendance percentage.
 * @param {number} attended - Number of classes attended.
 * @param {number} total - Total number of classes conducted.
 * @returns {number} - Percentage (0-100).
 */
export const calculateCurrentPercentage = (attended, total) => {
    if (total === 0) return 0;
    return (attended / total) * 100;
};
