import express from 'express';
import {
    saveProfileAndGenerateRoadmap,
    getCareerData,
    updateMilestoneProgress,
    sendCounselorMessage
} from '../controllers/careerController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all career routes
router.use(protect);

router.post('/profile', saveProfileAndGenerateRoadmap);
router.get('/data', getCareerData);
router.put('/milestone', updateMilestoneProgress);
router.post('/chat', sendCounselorMessage);

export default router;
