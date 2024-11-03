import { updateAllStockPrices } from '../src/services/dataUpdate.js';
import logger from '../src/utils/logger.js';

async function runPriceUpdater() {
  try {
    logger.info('Starting price updater script');
    const result = await updateAllStockPrices();
    logger.info('Price updater completed:', result);
  } catch (error) {
    logger.error('Error in price updater script:', error);
  }
}

runPriceUpdater();