import express from 'express';
import {
    generateResourceGraph,
    getResourceGraph,
} from '../controllers/resourceController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

//All routes are protected
router.use(protect);

router.post('/generate', generateResourceGraph);
router.get('/:documentId', getResourceGraph);

export default router;