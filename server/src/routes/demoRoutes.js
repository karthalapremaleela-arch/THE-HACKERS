import express from 'express';
import { getHealth, getDemoStatus, triggerSeed } from '../controllers/demoController.js';

const router = express.Router();

router.get('/health', getHealth);
router.get('/demo/status', getDemoStatus);
router.post('/demo/seed', triggerSeed);

export default router;
