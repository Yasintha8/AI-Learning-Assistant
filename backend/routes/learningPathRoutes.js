import express from 'express';
import { generateLearningPath } from '../controllers/learningPathController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateLearningPath);

export default router;