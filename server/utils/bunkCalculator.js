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

/**
 * Calculates how many classes can be safely skipped (bunked) while maintaining the requirement.
 * @param {number} attended - Number of classes attended.
 * @param {number} total - Total number of classes conducted.
 * @param {number} requirement - Required percentage (e.g., 75).
 * @returns {number} - Number of safe bunks.
 */
export const getSafeBunks = (attended, total, requirement) => {
    if (total === 0) return 0;
    const currentPct = (attended / total) * 100;
    
    if (currentPct < requirement) {
        return 0; // Already below requirement, cannot bunk.
    }

    // Equation: (attended) / (total + x) >= (requirement / 100)
    const possibleTotal = attended / (requirement / 100);
    const safeBunks = Math.floor(possibleTotal - total);
    
    return safeBunks > 0 ? safeBunks : 0;
};

/**
 * Calculates how many classes must be attended to reach the requirement.
 * @param {number} attended - Number of classes attended.
 * @param {number} total - Total number of classes conducted.
 * @param {number} requirement - Required percentage (e.g., 75).
 * @returns {number} - Number of classes needed.
 */
export const getRequiredClasses = (attended, total, requirement) => {
    const currentPct = total === 0 ? 0 : (attended / total) * 100;

    if (currentPct >= requirement) {
        return 0; // Already safe.
    }

    // Equation: (attended + x) / (total + x) >= (requirement / 100)
    // Let R = requirement / 100
    // attended + x >= R * (total + x)
    // attended + x >= R*total + R*x
    // x - R*x >= R*total - attended
    // x(1 - R) >= R*total - attended
    // x >= (R*total - attended) / (1 - R)

    const R = requirement / 100;
    // Special case check to avoid divide by zero if requirement is 100%
    if (R === 1) {
       // If 100% required, you can never catch up if you missed even one, technically infinite unless logic changes
       // But for reasonable requirements:
       const required = Math.ceil((R * total - attended) / (1 - R));
       return required > 0 ? required : 0;
    }
    
    const required = Math.ceil((R * total - attended) / (1 - R));
    return required > 0 ? required : 0;
};
