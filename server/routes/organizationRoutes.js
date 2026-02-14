import express from 'express';
import { 
    createOrganization, 
    getOrganizations, 
    getOrganizationById 
} from '../controllers/organizationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are for Super Admin
router.use(protect);
router.use(authorize('super_admin'));

router.route('/')
    .post(createOrganization)
    .get(getOrganizations);

router.route('/:id')
    .get(getOrganizationById);

export default router;
