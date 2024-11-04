// src/routes/stockPriceRoutes.js
import express from 'express';
import { getStockPrices, startStockPriceUpdate } from '../services/stockPriceService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Update all stock prices
router.post('/update', async (req, res) => {
  try {
    logger.info('Received request to update all stock prices');
    const result = await startStockPriceUpdate();
    res.status(202).json(result);
  } catch (error) {
    logger.error('Error starting stock price update:', error);
    res.status(500).json({ error: 'Unable to start stock price update' });
  }
});

// Get stock prices for a specific company
router.get('/:ticker', async (req, res) => {
  try {
    const stockPrices = await getStockPrices(req.params.ticker);
    res.json(stockPrices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/update-status', (req, res) => {
  const status = getUpdateStatus();
  res.json(status);
});
export default router;