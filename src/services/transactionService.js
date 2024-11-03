import { Transaction } from '../models/index.js';
import logger from '../utils/logger.js';

export async function addTransaction(transactionData) {
    try {
        const transaction = await Transaction.create(transactionData);
        logger.info(`New transaction added: ${transaction.purchase_id}`);
        return { message: 'Transaction added successfully', transaction };
    } catch (error) {
        logger.error('Error adding transaction:', error);
        throw new Error('Unable to add transaction: ' + error.message);
    }
}