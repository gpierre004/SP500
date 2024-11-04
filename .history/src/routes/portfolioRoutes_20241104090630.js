import express from 'express';
import { getPortfolioData } from '../services/portfolioService.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const portfolioData = await getPortfolioData(userId);
        res.json(portfolioData);
    } catch (error) {
        console.error('Error fetching portfolio data:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;