import { Transaction, StockPrice, Company } from '../models/index.js';
import { Op } from 'sequelize';

export async function getPortfolioData(userId) {
    try {
        // Get all transactions for the user
        const transactions = await Transaction.findAll({
            where: { portfolio_id: userId },
            include: [{ 
                model: Company,
                attributes: ['name', 'sector']
            }]
        });

        // Calculate portfolio value and performance
        let totalValue = 0;
        let totalCost = 0;
        const stockPerformance = {};

        for (const transaction of transactions) {
            const latestPrice = await StockPrice.findOne({
                where: { CompanyTicker: transaction.ticker },
                order: [['date', 'DESC']]
            });

            if (latestPrice) {
                const currentValue = latestPrice.close * transaction.quantity;
                const cost = transaction.purchase_price * transaction.quantity;
                
                totalValue += currentValue;
                totalCost += cost;

                stockPerformance[transaction.ticker] = {
                    ticker: transaction.ticker,
                    quantity: transaction.quantity,
                    currentPrice: latestPrice.close,
                    purchasePrice: transaction.purchase_price,
                    performance: ((latestPrice.close - transaction.purchase_price) / transaction.purchase_price * 100).toFixed(2)
                };
            }
        }

        const totalGainLoss = ((totalValue - totalCost) / totalCost * 100).toFixed(2);

        return {
            totalValue,
            totalGainLoss,
            stocks: Object.values(stockPerformance)
        };
    } catch (error) {
        console.error('Error calculating portfolio data:', error);
        throw new Error('Unable to calculate portfolio data');
    }
}