import express from 'express';
import { getPortfolioData } from '../services/portfolioService.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is available in the request
        const portfolioData = await getPortfolioData(userId);
        res.json(portfolioData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;