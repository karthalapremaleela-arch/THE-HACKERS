import express from 'express';
import { getHospitalMe, getHospitalDashboard } from '../controllers/hospitalController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

router.use(requireAuth, requireRole(['HOSPITAL', 'ADMIN']));

router.get('/me', getHospitalMe);
router.get('/dashboard', getHospitalDashboard);

export default router;
