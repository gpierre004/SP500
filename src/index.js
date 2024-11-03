import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { sequelize } from './models/index.js';
import cron from 'node-cron';
import { updateAllStockPrices, refreshSP500List, checkInvalidTickers } from './services/dataUpdate.js';
import { updateWatchListPrices, updateWatchListPriceChange } from './services/watchlistService.js';
import logger from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { exec } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
let PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', routes);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Use the error handling middleware
app.use(errorHandler);

// Schedule daily stock price updates
cron.schedule('0 18 * * 1-5', async () => {
  logger.info('Running daily stock price update');
  await updateAllStockPrices();
});

// Schedule weekly S&P 500 list refresh
cron.schedule('0 1 * * 1', async () => {
  logger.info('Running weekly S&P 500 list refresh');
  await refreshSP500List();
});

// Schedule daily stock price updates and watch list updates
cron.schedule('0 18 * * 1-5', async () => {
  logger.info('Running daily stock price update');
  await updateAllStockPrices();
  logger.info('Running watch list update');
  await updateWatchListPrices();
  logger.info('Running watch list price change update');
  await updateWatchListPriceChange();
});

// Schedule weekly S&P 500 list refresh and watch list cleanup
cron.schedule('0 1 * * 1', async () => {
  logger.info('Running weekly S&P 500 list refresh');
  await refreshSP500List();
  logger.info('Running watch list cleanup');
  await cleanupWatchList();
});

// Schedule hourly watch list price updates
cron.schedule('0 * * * *', async () => {
  logger.info('Running hourly watch list price update');
  await updateWatchListPrices();
  logger.info('Running hourly watch list price change update');
  await updateWatchListPriceChange();
});

// Start the price updater job
const priceUpdaterPath = path.join(__dirname, '..', 'scripts', 'priceUpdater.js');

cron.schedule('0 10-17 * * 1-5', () => {
  logger.info('Running hourly price update job');
  exec(`node ${priceUpdaterPath}`, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error running price updater: ${error.message}`);
      return;
    }
    if (stderr) {
      logger.error(`Price updater stderr: ${stderr}`);
      return;
    }
    logger.info(`Price updater stdout: ${stdout}`);
  });
}, {
  timezone: "America/New_York"
});

const startServer = async () => {
  try {
    await sequelize.sync();
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.warn(`Port ${PORT} is already in use. Trying port ${PORT + 1}`);
        PORT++;
        server.close();
        startServer();
      } else {
        logger.error('Error starting server:', error);
      }
    });
  } catch (error) {
    logger.error('Error starting server:', error);
  }
};

startServer();