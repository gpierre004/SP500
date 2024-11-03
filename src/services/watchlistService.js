import { Company, StockPrice, WatchList, User } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import logger from '../utils/logger.js';

const WATCH_LIST_THRESHOLD = 0.25; // 25% below 52-week high
const TREND_PERIOD = 1080; // 1080-day moving average for long-term trend

export async function updateWatchListPriceChange() {
  try {
    const watchListItems = await WatchList.findAll();

    for (const item of watchListItems) {
      const priceChange = ((item.currentPrice - item.priceWhenAdded) / item.priceWhenAdded * 100).toFixed(2);
      await item.update({ priceChange });
    }

    logger.info('Watch list price changes updated successfully');
    return { message: 'Watch list price changes updated successfully' };
  } catch (error) {
    logger.error('Error updating watch list price changes:', error);
    throw new Error('Unable to update watch list price changes');
  }
}

export async function updateWatchList(userId) {
  try {
    // Ensure user exists
    let user = await User.findByPk(userId);
    if (!user) {
      user = await User.create({
        id: userId,
        username: `dummyuser${userId}`,
        password: 'dummypassword',
        email: `dummyuser${userId}@example.com`
      });
      logger.info(`Created dummy user with id ${userId}`);
    }

    const potentialStocks = await getPotentialStocks();
    const updatedCount = await addToWatchList(userId, potentialStocks);
    return { message: `Watch list updated. ${updatedCount} new items added.` };
  } catch (error) {
    logger.error('Error updating watch list:', error);
    throw new Error('Unable to update watch list');
  }
}

export async function getWatchList(userId) {
  try {
    return await WatchList.findAll({
      where: { UserId: userId },
      include: [{ model: Company, attributes: ['name', 'sector'] }],
      order: [['dateAdded', 'DESC']]
    });
  } catch (error) {
    logger.error('Error fetching watch list:', error);
    throw new Error('Unable to fetch watch list');
  }
}

export async function cleanupWatchList() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { count } = await WatchList.destroy({
      where: {
        dateAdded: { [Op.lt]: sixMonthsAgo }
      }
    });

    return { message: `Watch list cleaned up. ${count} old items removed.` };
  } catch (error) {
    logger.error('Error cleaning up watch list:', error);
    throw new Error('Unable to clean up watch list');
  }
}

async function getPotentialStocks() {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2); // Two years ago

  return await StockPrice.findAll({
    attributes: [
      'CompanyTicker',
      [Sequelize.fn('MAX', Sequelize.col('high')), '52WeekHigh'],
      [Sequelize.fn('AVG', Sequelize.col('close')), 'avgClose'],
      [Sequelize.literal('(SELECT close FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1)'), 'currentPrice'],
    ],
    include: [{ 
      model: Company,
      attributes: ['name', 'sector']
    }],
    where: {
      date: { [Op.gte]: twoYearsAgo }
    },
    group: ['CompanyTicker', 'Company.ticker', 'Company.name', 'Company.sector'],
    having: Sequelize.literal(`
      (SELECT close FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1) <= (1 - ${WATCH_LIST_THRESHOLD}) * MAX("StockPrice"."high")
      AND (SELECT close FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1) >= 0.70 * MAX("StockPrice"."high")
    `),
    order: [[Sequelize.literal('MAX("StockPrice"."high") - (SELECT close FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1)'), 'DESC']]
  });
}

async function addToWatchList(userId, potentialStocks) {
  let addedCount = 0;
  const today = new Date();

  for (const stock of potentialStocks) {
    const existingEntry = await WatchList.findOne({
      where: {
        CompanyTicker: stock.CompanyTicker,
        UserId: userId,
        dateAdded: {
          [Op.gte]: Sequelize.literal("CURRENT_DATE - INTERVAL '1 day'")
        }
      }
    });

    const currentPrice = parseFloat(stock.dataValues.currentPrice);
    const weekHigh52 = parseFloat(stock.dataValues['52WeekHigh']);
    const percentBelow52WeekHigh = ((weekHigh52 - currentPrice) / weekHigh52 * 100).toFixed(2);

    if (!existingEntry) {
      const avgClose = parseFloat(stock.dataValues.avgClose);
      const priceWhenAdded = currentPrice;
      const priceChange = 0; // Initialize price change to 0 for new entries

      await WatchList.create({
        CompanyTicker: stock.CompanyTicker,
        UserId: userId,
        dateAdded: today,
        reason: 'Potential opportunity: Trading below 52-week high',
        sector: stock.Company.sector,
        priceWhenAdded,
        currentPrice,
        priceChange,
        weekHigh52,
        percentBelow52WeekHigh,
        avgClose
      });
      addedCount++;
    } else {
      // Update existing entry
      await existingEntry.update({
        currentPrice,
        percentBelow52WeekHigh,
        dateAdded: today
      });
    }
  }

  return addedCount;
}

export async function updateWatchListPrices() {
  try {
    const watchListItems = await WatchList.findAll({
      attributes: ['id', 'CompanyTicker']
    });

    for (const item of watchListItems) {
      const latestPrice = await StockPrice.findOne({
        where: { CompanyTicker: item.CompanyTicker },
        order: [['date', 'DESC']],
        attributes: ['close']
      });

      if (latestPrice) {
        await WatchList.update(
          { currentPrice: latestPrice.close },
          { where: { id: item.id } }
        );
      }
    }

    logger.info('Watch list prices updated successfully');
    return { message: 'Watch list prices updated successfully' };
  } catch (error) {
    logger.error('Error updating watch list prices:', error);
    throw new Error('Unable to update watch list prices');
  }
}