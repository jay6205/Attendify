import express from 'express';
import { 
    createAdmin, 
    getAllAdmins, 
    toggleAdminStatus, 
    resetAdminPassword 
} from '../controllers/superAdminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected and require super_admin role
router.use(protect);
router.use(authorize('super_admin'));

router.route('/admins')
    .post(createAdmin)
    .get(getAllAdmins);

router.route('/admins/:id/toggle-status')
    .patch(toggleAdminStatus);

router.route('/admins/:id/password')
    .put(resetAdminPassword);

export default router;
