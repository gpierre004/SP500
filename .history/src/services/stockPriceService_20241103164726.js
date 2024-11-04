// src/services/stockPriceService.js
import { StockPrice } from '../models/index.js';
import logger from '../utils/logger.js';
import { updateAllStockPrices } from './dataUpdate.js';

export async function getStockPrices(ticker, limit = 30) {
  try {
    return await StockPrice.findAll({
      where: { CompanyTicker: ticker },
      order: [['date', 'DESC']],
      limit: limit
    });
  } catch (error) {
    logger.error('Error fetching stock prices:', error);
    throw new Error('Unable to fetch stock prices');
  }
}

export async function startStockPriceUpdate() {
  try {
    // Perform the update asynchronously
    updateAllStockPrices().catch(error => {
      logger.error('Error updating all stock prices:', error);
    });
    return { message: 'Stock price update started' };
  } catch (error) {
    logger.error('Error starting stock price update:', error);
    throw new Error('Unable to start stock price update');
  }
}

export function getUpdateStatus() {
  // This is a simple implementation. You might want to use a more robust solution for production.
  return global.updateStatus || { status: 'unknown' };
}