import Course from '../models/Course.js';

let courseCache = new Map(); // Map<organizationId, { names: string[], lastFetched: number }>
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extracts entities (subject, batch) from the message.
 * @param {string} message 
 * @param {string} organizationId 
 * @returns {Promise<{ subjectName: string|null, subjectId: string|null, batch: string|null, threshold?: number }>}
 */
export const extractEntities = async (message, organizationId) => {
    const lowerMsg = message.toLowerCase();
    const result = {
        subjectName: null,
        subjectId: null, // We might not get ID purely from text without strict matching, but we'll try to find the best match object
        batch: null
    };

    // 1. Extract Batch (Regex)
    // Common patterns: "2023-2027", "Batch A", "Class 10" - highly variable.
    // For now, looking for year-range like patterns 20xx-20xx
    const batchMatch = lowerMsg.match(/(\d{4}-\d{4})/);
    if (batchMatch) {
        result.batch = batchMatch[0];
    }

    // 1.5 Extract Threshold (Number)
    // Look for numbers like "40", "below 75", "< 50"
    // We'll take the first 2-digit number found that isn't part of a year range
    const numberMatch = lowerMsg.match(/(?<!\d)(\d{1,2})(?!\d)/); // Matches 1 or 2 digit numbers 0-99 isolated
    if (numberMatch) {
        result.threshold = parseInt(numberMatch[0]);
    }

    // 2. Extract Subject (Fuzzy Match against Course List)
    if (!organizationId) return result;

    const now = Date.now();
    let courses = [];
    let cacheHit = false;

    // Check Cache
    if (courseCache.has(organizationId.toString())) {
        const cached = courseCache.get(organizationId.toString());
        if (now - cached.lastFetched < CACHE_TTL) {
            courses = cached.data;
            cacheHit = true;
        }
    }

    // Refresh Cache if needed
    if (courses.length === 0) {
        try {
            // Fetch only necessary fields
            const fetchedCourses = await Course.find({ organization: organizationId }).select('name code');
            courses = fetchedCourses.map(c => ({
                name: c.name.toLowerCase(),
                code: c.code?.toLowerCase() ?? '',
                originalName: c.name,
                id: c._id
            }));

            courseCache.set(organizationId.toString(), {
                data: courses,
                lastFetched: now
            });
        } catch (error) {
            console.error("Entity Extraction - Course Fetch Failed:", error);
            return result; // Fail gracefully
        }
    }

    // Matching Logic: Look for course name or code in message
    // Sort by length desc to match "Data Structures" before "Data"
    courses.sort((a, b) => b.name.length - a.name.length);

    for (const course of courses) {
        if (lowerMsg.includes(course.name) || lowerMsg.includes(course.code)) {
            result.subjectName = course.originalName;
            result.subjectId = course.id;
            break; // Stop at first valid match
        }
    }

    return result;
};
