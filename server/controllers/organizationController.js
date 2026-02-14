import Organization from '../models/Organization.js';
import User from '../models/User.js';

// @desc    Create a new Organization
// @route   POST /api/v2/super-admin/organizations
// @access  Super Admin
export const createOrganization = async (req, res) => {
    try {
        const { name, code } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Organization name is required' });
        }

        const orgExists = await Organization.findOne({ name });
        if (orgExists) {
            return res.status(400).json({ message: 'Organization already exists' });
        }

        const organization = await Organization.create({
            name,
            code,
            createdBy: req.user.email // Assuming Super Admin email is in req.user
        });

        res.status(201).json(organization);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all Organizations
// @route   GET /api/v2/super-admin/organizations
// @access  Super Admin
export const getOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find({});
        res.json(organizations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Organization by ID
// @route   GET /api/v2/super-admin/organizations/:id
// @access  Super Admin
export const getOrganizationById = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.json(organization);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
