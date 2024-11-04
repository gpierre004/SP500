import express from 'express';
import { getStockPrices, getUpdateStatus } from '../services/stockPriceService.js';
import { updateAllStockPrices } from '../services/dataUpdate.js';
import logger from '../utils/logger.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Update all stock prices
router.post('/update', async (req, res) => {
  try {
    logger.info('Received request to update all stock prices');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const priceUpdaterPath = path.join(__dirname, '..', '..', 'scripts', 'priceUpdater.js');

    logger.info(`Executing price updater script at: ${priceUpdaterPath}`);
    exec(`node ${priceUpdaterPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error running price updater: ${error.message}`);
        res.status(500).json({ error: 'Failed to update stock prices', details: error.message });
        return;
      }
      if (stderr) {
        logger.error(`Price updater stderr: ${stderr}`);
        res.status(500).json({ error: 'Failed to update stock prices', details: stderr });
        return;
      }
      logger.info(`Price updater stdout: ${stdout}`);
      res.status(202).json({ message: 'Stock price update started', details: stdout });
    });
  } catch (error) {
    logger.error('Error starting stock price update:', error);
    res.status(500).json({ error: 'Unable to start stock price update', details: error.message });
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