import express from 'express';
import {
  getAdminDashboard,
  getHospitals,
  approveHospital,
  rejectHospital,
  getAllRequests,
  getAllNotifications,
  getAuditLogs,
  getDonors,
} from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validateRequest, hospitalRejectSchema } from '../middleware/validate.js';

const router = express.Router();

// Restrict all routes to authenticated ADMIN users
router.use(requireAuth, requireRole('ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.get('/hospitals', getHospitals);
router.patch('/hospitals/:id/approve', approveHospital);
router.patch('/hospitals/:id/reject', validateRequest(hospitalRejectSchema), rejectHospital);
router.get('/requests', getAllRequests);
router.get('/notifications', getAllNotifications);
router.get('/audit-logs', getAuditLogs);
router.get('/donors', getDonors);

export default router;
