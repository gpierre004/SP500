import { Transaction, StockPrice } from '../models/index.js';

export async function getPortfolioData(userId) {
    const transactions = await Transaction.findAll({ where: { userId } });
    const portfolioData = {
        totalValue: 0,
        totalGainLoss: 0,
        dates: [],
        values: [],
        stocks: []
    };

    for (const transaction of transactions) {
        const latestPrice = await StockPrice.findOne({
            where: { CompanyTicker: transaction.ticker },
            order: [['date', 'DESC']]
        });

        if (latestPrice) {
            const currentValue = latestPrice.close * transaction.quantity;
            const gainLoss = ((latestPrice.close - transaction.purchase_price) / transaction.purchase_price) * 100;
            portfolioData.totalValue += currentValue;
            portfolioData.totalGainLoss += gainLoss;
            portfolioData.stocks.push({
                ticker: transaction.ticker,
                performance: gainLoss
            });
        }
    }

    // Calculate historical portfolio value over time
    // This is a simplified example; you might want to aggregate data by date
    const historicalPrices = await StockPrice.findAll({
        where: { CompanyTicker: transactions.map(t => t.ticker) },
        order: [['date', 'ASC']]
    });

    historicalPrices.forEach(price => {
        const date = price.date.toISOString().split('T')[0];
        if (!portfolioData.dates.includes(date)) {
            portfolioData.dates.push(date);
            portfolioData.values.push(0);
        }
        const index = portfolioData.dates.indexOf(date);
        portfolioData.values[index] += price.close * transactions.find(t => t.ticker === price.CompanyTicker).quantity;
    });

    return portfolioData;
}