import express from 'express';
import {
  getDonorMe,
  updateDonorProfile,
  toggleAvailability,
  getDonorAlerts,
  markAlertViewed,
  respondToAlert,
} from '../controllers/donorController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  validateRequest,
  donorUpdateSchema,
  donorAvailabilityToggleSchema,
  alertResponseSchema,
} from '../middleware/validate.js';

export const donorRouter = express.Router();
export const alertRouter = express.Router();

// Donor Profile & Alerts
donorRouter.use(requireAuth, requireRole('DONOR'));
donorRouter.get('/me', getDonorMe);
donorRouter.patch('/me', validateRequest(donorUpdateSchema), updateDonorProfile);
donorRouter.patch('/me/availability', validateRequest(donorAvailabilityToggleSchema), toggleAvailability);
donorRouter.get('/me/alerts', getDonorAlerts);

// Alert Actions
alertRouter.use(requireAuth, requireRole('DONOR'));
alertRouter.patch('/:id/view', markAlertViewed);
alertRouter.patch('/:id/respond', validateRequest(alertResponseSchema), respondToAlert);

export default {
  donorRouter,
  alertRouter,
};
