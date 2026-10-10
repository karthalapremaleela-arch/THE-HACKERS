import express from 'express';
import {
  createBloodRequest,
  getRequests,
  getRequestById,
  getRequestMatches,
  cancelBloodRequest,
} from '../controllers/requestController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireApprovedHospital } from '../middleware/roles.js';
import { validateRequest, bloodRequestCreateSchema } from '../middleware/validate.js';

const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  requireApprovedHospital,
  validateRequest(bloodRequestCreateSchema),
  createBloodRequest
);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.get('/:id/matches', getRequestMatches);
router.patch('/:id/cancel', cancelBloodRequest);

export default router;
