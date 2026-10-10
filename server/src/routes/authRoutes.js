import express from 'express';
import {
  registerHospital,
  registerDonor,
  login,
  getMe,
} from '../controllers/authController.js';
import {
  validateRequest,
  hospitalRegisterSchema,
  donorRegisterSchema,
  loginSchema,
} from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register/hospital', validateRequest(hospitalRegisterSchema), registerHospital);
router.post('/register/donor', validateRequest(donorRegisterSchema), registerDonor);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', requireAuth, getMe);

export default router;
