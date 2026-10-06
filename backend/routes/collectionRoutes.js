import express from 'express';
import {
    getCollections,
    createCollection,
    updateCollection,
    deleteCollection,
} from '../controllers/collectionController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getCollections);
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);

export default router;
