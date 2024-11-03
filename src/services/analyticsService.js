import { sequelize } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { Company, StockPrice } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

async function checkCompanyExists(ticker) {
  const company = await Company.findByPk(ticker);
  if (!company) {
    throw new AppError(`Company with ticker ${ticker} not found`, 404);
  }
}

export async function getPriceData(ticker, range) {
  await checkCompanyExists(ticker);

  let dateCondition;
  switch (range) {
    case '1d':
      dateCondition = "date >= CURRENT_DATE - INTERVAL '1 day'";
      break;
    case '1w':
      dateCondition = "date >= CURRENT_DATE - INTERVAL '1 week'";
      break;
    case '1m':
      dateCondition = "date >= CURRENT_DATE - INTERVAL '1 month'";
      break;
    case '1y':
      dateCondition = "date >= CURRENT_DATE - INTERVAL '1 year'";
      break;
    case '3y':
      dateCondition = "date >= CURRENT_DATE - INTERVAL '3 years'";
      break;
    default:
      dateCondition = "date >= CURRENT_DATE - INTERVAL '1 year'";
      break;
  }

  const query = `
    SELECT date, open, high, low, close
    FROM public."StockPrices"
    WHERE "CompanyTicker" = :ticker AND ${dateCondition}
    ORDER BY date ASC
  `;

  const result = await sequelize.query(query, {
    replacements: { ticker },
    type: sequelize.QueryTypes.SELECT
  });

  if (result.length === 0) {
    throw new AppError(`No price data found for ticker ${ticker}`, 404);
  }

  return result;
}

export async function getPriceTrend(ticker) {
  await checkCompanyExists(ticker);

  const query = `
    SELECT date, "CompanyTicker", "SMA_20", "SMA_50", "SMA_200"
    FROM public.combine_analysis_view
    WHERE "CompanyTicker" = :ticker
    ORDER BY date DESC
    LIMIT 100
  `;

  const result = await sequelize.query(query, {
    replacements: { ticker },
    type: sequelize.QueryTypes.SELECT
  });

  if (result.length === 0) {
    throw new AppError(`No price trend data found for ticker ${ticker}`, 404);
  }

  return result;
}

export async function getBollingerBands(ticker) {
  await checkCompanyExists(ticker);

  const query = `
    SELECT date, "CompanyTicker", "SMA_20" as middle_band, "Upper_Band", "Lower_Band"
    FROM public.combine_analysis_view
    WHERE "CompanyTicker" = :ticker
    ORDER BY date DESC
    LIMIT 100
  `;

  const result = await sequelize.query(query, {
    replacements: { ticker },
    type: sequelize.QueryTypes.SELECT
  });

  if (result.length === 0) {
    throw new AppError(`No Bollinger Bands data found for ticker ${ticker}`, 404);
  }

  return result;
}

export async function getVolumeAnalysis(ticker) {
  await checkCompanyExists(ticker);

  const query = `
    SELECT date, "CompanyTicker", volume, "SMA_20"
    FROM public.combine_analysis_view
    WHERE "CompanyTicker" = :ticker
    ORDER BY date DESC
    LIMIT 100
  `;

  const result = await sequelize.query(query, {
    replacements: { ticker },
    type: sequelize.QueryTypes.SELECT
  });

  if (result.length === 0) {
    throw new AppError(`No volume analysis data found for ticker ${ticker}`, 404);
  }

  return result;
}

export async function getRSI(ticker) {
  await checkCompanyExists(ticker);
  
  const query = `
    WITH price_change AS (
      SELECT 
        date,
        "CompanyTicker",
        "SMA_20" - LAG("SMA_20") OVER (ORDER BY date) AS change
      FROM public.combine_analysis_view
      WHERE "CompanyTicker" = :ticker
    ),
    gain_loss AS (
      SELECT 
        date,
        "CompanyTicker",
        CASE WHEN change > 0 THEN change ELSE 0 END AS gain,
        CASE WHEN change < 0 THEN ABS(change) ELSE 0 END AS loss
      FROM price_change
    ),
    avg_gain_loss AS (
      SELECT 
        date,
        "CompanyTicker",
        AVG(gain) OVER (ORDER BY date ROWS BETWEEN 13 PRECEDING AND CURRENT ROW) AS avg_gain,
        AVG(loss) OVER (ORDER BY date ROWS BETWEEN 13 PRECEDING AND CURRENT ROW) AS avg_loss
      FROM gain_loss
    )
    SELECT 
      date,
      "CompanyTicker",
      100 - (100 / (1 + (avg_gain / NULLIF(avg_loss, 0)))) AS rsi
    FROM avg_gain_loss
    ORDER BY date DESC
    LIMIT 100
  `;

  const result = await sequelize.query(query, {
    replacements: { ticker },
    type: sequelize.QueryTypes.SELECT
  });

  if (result.length === 0) {
    throw new AppError(`No RSI data found for ticker ${ticker}`, 404);
  }

  return result;
}

export async function getPricePerformance(ticker) {
  try {
    await checkCompanyExists(ticker);

    const query = `
      WITH latest_price AS (
        SELECT close, date
        FROM public."StockPrices"
        WHERE "CompanyTicker" = :ticker
        ORDER BY date DESC
        LIMIT 1
      ),
      historical_prices AS (
        SELECT close, date
        FROM public."StockPrices"
        WHERE "CompanyTicker" = :ticker
          AND date >= (SELECT date FROM latest_price) - INTERVAL '10 years'
        ORDER BY date DESC
      ),
      ytd_price AS (
        SELECT close
        FROM historical_prices
        WHERE date <= (SELECT date_trunc('year', date) FROM latest_price)
        ORDER BY date DESC
        LIMIT 1
      )
      SELECT
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '5 days'
         ORDER BY hp.date DESC
         LIMIT 1) AS "5d",
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '10 days'
         ORDER BY hp.date DESC
         LIMIT 1) AS "10d",
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '1 month'
         ORDER BY hp.date DESC
         LIMIT 1) AS "1m",
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '3 months'
         ORDER BY hp.date DESC
         LIMIT 1) AS "3m",
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '6 months'
         ORDER BY hp.date DESC
         LIMIT 1) AS "6m",
        (SELECT (latest.close - ytd.close) / ytd.close * 100
         FROM ytd_price ytd) AS "ytd",
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '1 year'
         ORDER BY hp.date DESC
         LIMIT 1) AS "1y",
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '2 years'
         ORDER BY hp.date DESC
         LIMIT 1) AS "2y",
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '5 years'
         ORDER BY hp.date DESC
         LIMIT 1) AS "5y",
        (SELECT (latest.close - hp.close) / hp.close * 100
         FROM historical_prices hp
         WHERE hp.date <= latest.date - INTERVAL '10 years'
         ORDER BY hp.date DESC
         LIMIT 1) AS "10y"
      FROM latest_price latest
    `;

    const result = await sequelize.query(query, {
      replacements: { ticker },
      type: sequelize.QueryTypes.SELECT
    });

    if (result.length === 0) {
      logger.warn(`No price performance data found for ticker ${ticker}`);
      throw new AppError(`No price performance data found for ticker ${ticker}`, 404);
    }

    // Convert the result to the desired format
    const performanceData = result[0];
    Object.keys(performanceData).forEach(key => {
      performanceData[key] = performanceData[key] ? Number(performanceData[key]).toFixed(2) : null;
    });

    logger.info(`Price performance result for ${ticker}: ${JSON.stringify(performanceData)}`);
    return performanceData;
  } catch (error) {
    logger.error(`Error in getPricePerformance for ${ticker}: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);
    throw error;
  }
}