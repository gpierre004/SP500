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

export function getUpdateStatus() {
  // This is a simple implementation. You might want to use a more robust solution for production.
  return global.updateStatus || { status: 'unknown' };
}