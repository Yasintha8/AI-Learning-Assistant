import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import learningPathRoutes from './routes/learningPathRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import careerRoutes from './routes/careerRoutes.js';

// ES6 module __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Trust reverse proxy (Render, Vercel, Cloudflare, AWS ALB)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Production Security Headers with Helmet
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows file previews for uploaded documents
        contentSecurityPolicy: false, // Prevents blocking client-side resources in API mode
    })
);

// Middleware to handle CORS
app.use(
    cors({
        origin: '*',
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Static folder for uploads with CORS and CORP headers for browser preview
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Apply Rate Limiting
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);

// Dedicated Health Check endpoint for cloud deployment monitors & load balancers
app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(isDbConnected ? 200 : 503).json({
        status: isDbConnected ? 'healthy' : 'degraded',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: isDbConnected ? 'connected' : 'disconnected'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/learning-path', learningPathRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/career', careerRoutes);

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        statusCode: 404
    });
});

// Start Server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown handling for cloud orchestrators (Docker, Kubernetes, Render)
const shutdown = (signal) => {
    console.log(`Received ${signal}. Gracefully closing HTTP server and database...`);
    server.close(async () => {
        try {
            await mongoose.connection.close(false);
            console.log('MongoDB connection closed cleanly.');
            process.exit(0);
        } catch (err) {
            console.error('Error during MongoDB disconnect:', err);
            process.exit(1);
        }
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    process.exit(1);
});