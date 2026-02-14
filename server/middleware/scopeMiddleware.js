import Organization from '../models/Organization.js';

// @desc    Attach Organization Scope to Request
// @access  Internal Middleware
export const attachOrganizationScope = async (req, res, next) => {
    try {
        // 1. Super Admin: Can optionally scope to a specific org via query param, or see all
        if (req.user.role === 'super_admin') {
            // If super admin wants to masquerade or filter by org
            if (req.query.organizationId) {
                req.organizationId = req.query.organizationId;
            }
            // Otherwise, req.organizationId is undefined (global access)
            return next();
        }

        // 2. Regular Users (Admin, Teacher, Student): MUST have an organization
        if (!req.user.organization) {
             return res.status(403).json({ message: 'User does not belong to an organization' });
        }

        // Attach org ID to request object for easy access in controllers
        req.organizationId = req.user.organization;
        next();
    } catch (error) {
        console.error('Scope Middleware Error:', error);
        res.status(500).json({ message: 'Server Error during scoping' });
    }
};
