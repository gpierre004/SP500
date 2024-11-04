import { Company, StockPrice, WatchList, User } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import logger from '../utils/logger.js';

// Constants
const DAYS_THRESHOLD = 90; // Don't add stocks that were added in the last 90 days
const PRICE_DROP_THRESHOLD = 0.25; // 25% below 52-week high
const RECOVERY_THRESHOLD = 0.70; // Stock should be at least 70% of its 52-week high
const VOLUME_INCREASE_THRESHOLD = 1.5; // 50% increase in volume compared to average
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
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return await StockPrice.findAll({
    attributes: [
      'CompanyTicker',
      [Sequelize.fn('MAX', Sequelize.col('high')), '52WeekHigh'],
      [Sequelize.fn('AVG', Sequelize.col('close')), 'avgClose'],
      [Sequelize.fn('AVG', Sequelize.col('volume')), 'avgVolume'],
      [Sequelize.literal('(SELECT close FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1)'), 'currentPrice'],
      [Sequelize.literal('(SELECT volume FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1)'), 'currentVolume'],
    ],
    include: [{ 
      model: Company,
      attributes: ['name', 'sector', 'industry']
    }],
    where: {
      date: { [Op.gte]: oneYearAgo }
    },
    group: ['CompanyTicker', 'Company.ticker', 'Company.name', 'Company.sector', 'Company.industry'],
    having: Sequelize.and(
      // Price is below threshold of 52-week high
      Sequelize.literal(`
        (SELECT close FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1) 
        <= (1 - ${PRICE_DROP_THRESHOLD}) * MAX("StockPrice"."high")
      `),
      // Price is above recovery threshold
      Sequelize.literal(`
        (SELECT close FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1) 
        >= ${RECOVERY_THRESHOLD} * MAX("StockPrice"."high")
      `),
      // Volume is increasing
      Sequelize.literal(`
        (SELECT volume FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1)
        >= ${VOLUME_INCREASE_THRESHOLD} * AVG("StockPrice"."volume")
      `)
    ),
    order: [[Sequelize.literal('MAX("StockPrice"."high") - (SELECT close FROM "StockPrices" sp WHERE sp."CompanyTicker" = "StockPrice"."CompanyTicker" ORDER BY date DESC LIMIT 1)'), 'DESC']]
  });
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