import express from "express";
import { body } from 'express-validator';
import {
    register,
    login,
    googleAuth,
    getProfile,
    updateProfile,
    uploadAvatar,
    changePassword
} from '../controllers/authController.js';

import protect from '../middleware/auth.js';
import avatarUpload from '../config/avatarMulter.js';

const router = express.Router();

// Validation middleware
const registervalidation = [
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters'),
    body('email')
        .isEmail()
        .normalizeEmail('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

//Public routes
router.post('/register', registervalidation, register);
router.post('/login', loginValidation, login);
router.post('/google', googleAuth);

//Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.post('/change-password', protect, changePassword);

export default router;
