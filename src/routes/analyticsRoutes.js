import express from 'express';
import { getPriceTrend, getBollingerBands, getVolumeAnalysis, getRSI, getPriceData, getPricePerformance } from '../services/analyticsService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/price-data/:ticker', async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const { range } = req.query;
    logger.info(`Fetching price data for ticker: ${ticker}, range: ${range}`);
    const result = await getPriceData(ticker, range);
    logger.info(`Successfully fetched price data for ${ticker}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error fetching price data for ticker ${req.params.ticker}: ${error.message}`);
    next(error);
  }
});

router.get('/price-trend/:ticker', async (req, res, next) => {
  try {
    logger.info(`Fetching price trend for ticker: ${req.params.ticker}`);
    const result = await getPriceTrend(req.params.ticker);
    logger.info(`Successfully fetched price trend for ${req.params.ticker}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error fetching price trend for ticker ${req.params.ticker}: ${error.message}`);
    next(error);
  }
});

router.get('/bollinger-bands/:ticker', async (req, res, next) => {
  try {
    logger.info(`Fetching Bollinger Bands for ticker: ${req.params.ticker}`);
    const result = await getBollingerBands(req.params.ticker);
    logger.info(`Successfully fetched Bollinger Bands for ${req.params.ticker}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error fetching Bollinger Bands for ticker ${req.params.ticker}: ${error.message}`);
    next(error);
  }
});

router.get('/volume-analysis/:ticker', async (req, res, next) => {
  try {
    logger.info(`Fetching volume analysis for ticker: ${req.params.ticker}`);
    const result = await getVolumeAnalysis(req.params.ticker);
    logger.info(`Successfully fetched volume analysis for ${req.params.ticker}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error fetching volume analysis for ticker ${req.params.ticker}: ${error.message}`);
    next(error);
  }
});

router.get('/rsi/:ticker', async (req, res, next) => {
  try {
    logger.info(`Fetching RSI for ticker: ${req.params.ticker}`);
    const result = await getRSI(req.params.ticker);
    logger.info(`Successfully fetched RSI for ${req.params.ticker}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error fetching RSI for ticker ${req.params.ticker}: ${error.message}`);
    next(error);
  }
});

router.get('/price-performance/:ticker', async (req, res, next) => {
  try {
    const { ticker } = req.params;
    logger.info(`Fetching price performance for ticker: ${ticker}`);
    const result = await getPricePerformance(ticker);
    logger.info(`Successfully fetched price performance for ${ticker}: ${JSON.stringify(result)}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error fetching price performance for ticker ${req.params.ticker}: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);
    next(error);
  }
});

export default router;