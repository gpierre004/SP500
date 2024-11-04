import express from 'express';
import companyRoutes from './companyRoutes.js';
import stockPriceRoutes from './stockPriceRoutes.js';
import watchListRoutes from './watchListRoutes.js';
import userRoutes from './userRoutes.js';
import analysisRoutes from './analysisRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import portfolioRoutes from './portfolioRoutes.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Mount the routes
router.use('/stock-prices', stockPriceRoutes);
router.use('/companies', companyRoutes);
router.use('/watch-list', watchListRoutes);
router.use('/users', userRoutes);
router.use('/analysis', analysisRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/transactions', transactionRoutes);

export default router;