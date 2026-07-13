import express from 'express';
import { generateLearningPath, updateLearningPath, getLearningPath } from '../controllers/learningPathController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateLearningPath);
router.post('/update', updateLearningPath);
router.get('/:userId', getLearningPath);

export default router;