import { Company, StockPrice } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import logger from '../utils/logger.js';

export async function getWatchListCandidates() {
  try {
    logger.info('Fetching watch list candidates');
    
    const candidates = await StockPrice.findAll({
      attributes: [
        'CompanyTicker',
        [Sequelize.fn('AVG', Sequelize.col('close')), 'avgClose'],
        [Sequelize.fn('MAX', Sequelize.col('high')), 'yearHigh'],
        [Sequelize.fn('MIN', Sequelize.col('low')), 'yearLow'],
      ],
      include: [{ model: Company, attributes: ['name', 'sector'] }],
      where: {
        date: {
          [Op.gte]: Sequelize.literal("CURRENT_DATE - INTERVAL '1 year'")
        }
      },
      group: ['CompanyTicker', 'Company.name', 'Company.sector'],
      having: Sequelize.and(
        Sequelize.where(Sequelize.col('StockPrice.close'), '<=', Sequelize.literal('0.9 * "yearHigh"')),
        Sequelize.where(Sequelize.col('StockPrice.close'), '>=', Sequelize.literal('1.2 * "yearLow"'))
      ),
      order: [[Sequelize.literal('"yearHigh" - "StockPrice"."close"'), 'DESC']]
    });

    logger.info(`Found ${candidates.length} watch list candidates`);
    
    // Log a sample of the candidates (first 5)
    logger.info(`Sample candidates: ${JSON.stringify(candidates.slice(0, 5))}`);

    return candidates;
  } catch (error) {
    logger.error('Error fetching watch list candidates:', error);
    throw new Error('Unable to fetch watch list candidates');
  }
}