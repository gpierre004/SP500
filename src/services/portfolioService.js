import { Transaction, StockPrice } from '../models/index.js';

export async function getPortfolioData(userId) {
    try {
        const transactions = await Transaction.findAll({ where: { portfolio_id: userId } });
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

                if (!stockPerformance[transaction.ticker]) {
                    stockPerformance[transaction.ticker] = {
                        ticker: transaction.ticker,
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

        const stocks = Object.values(stockPerformance).map(stock => ({
            ...stock,
            averageCost: stock.totalCost / stock.quantity,
            currentPrice: stock.currentValue / stock.quantity,
            gainLoss: ((stock.currentValue - stock.totalCost) / stock.totalCost * 100).toFixed(2)
        }));

        const totalGainLoss = totalCost > 0 
            ? ((totalValue - totalCost) / totalCost * 100).toFixed(2)
            : 0;

        return {
            totalValue,
            totalGainLoss,
            stocks
        };
    } catch (error) {
        console.error('Error calculating portfolio data:', error);
        throw new Error('Unable to calculate portfolio data');
    }
}