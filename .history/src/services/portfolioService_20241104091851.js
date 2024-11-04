import { Transaction, StockPrice, Company } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import logger from '../utils/logger.js';

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

        if (!transactions || transactions.length === 0) {
            return {
                totalValue: 0,
                totalGainLoss: 0,
                stocks: []
            };
        }

        let totalValue = 0;
        let totalCost = 0;
        const stockPerformance = {};

        // Process each transaction
        for (const transaction of transactions) {
            const latestPrice = await StockPrice.findOne({
                where: { CompanyTicker: transaction.ticker },
                order: [['date', 'DESC']]
            });

            if (latestPrice) {
                const currentValue = latestPrice.close * transaction.quantity;
                const cost = transaction.purchase_price * transaction.quantity;

                if (transaction.type === 'buy') {
                    totalValue += currentValue;
                    totalCost += cost;

                    // Update or create stock entry
                    if (!stockPerformance[transaction.ticker]) {
                        stockPerformance[transaction.ticker] = {
                            ticker: transaction.ticker,
                            companyName: transaction.Company?.name || 'Unknown',
                            sector: transaction.Company?.sector || 'Unknown',
                            quantity: 0,
                            totalCost: 0,
                            currentValue: 0
                        };
                    }

                    stockPerformance[transaction.ticker].quantity += transaction.quantity;
                    stockPerformance[transaction.ticker].totalCost += cost;
                    stockPerformance[transaction.ticker].currentValue += currentValue;
                }
            }
        }

        // Calculate performance metrics for each stock
        const stocks = Object.values(stockPerformance).map(stock => ({
            ...stock,
            averageCost: stock.totalCost / stock.quantity,
            currentPrice: stock.currentValue / stock.quantity,
            gainLoss: ((stock.currentValue - stock.totalCost) / stock.totalCost * 100).toFixed(2)
        }));

        // Calculate total portfolio performance
        const totalGainLoss = totalCost > 0 
            ? ((totalValue - totalCost) / totalCost * 100).toFixed(2)
            : 0;

        return {
            totalValue,
            totalGainLoss,
            stocks
        };
    } catch (error) {
        logger.error('Error calculating portfolio data:', error);
        throw new Error('Unable to calculate portfolio data');
    }
}