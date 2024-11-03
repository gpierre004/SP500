import { Company } from '../models/index.js';
import logger from '../utils/logger.js';
import { refreshSP500List } from './dataUpdate.js';

export async function getAllCompanies() {
  try {
    return await Company.findAll();
  } catch (error) {
    logger.error('Error fetching companies:', error);
    throw new Error('Unable to fetch companies');
  }
}

export async function getCompanyByTicker(ticker) {
  try {
    const company = await Company.findByPk(ticker);
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  } catch (error) {
    logger.error('Error fetching company:', error);
    throw new Error('Unable to fetch company');
  }
}

export async function refreshCompanyList() {
  try {
    await refreshSP500List();
    return { message: 'S&P 500 list refreshed successfully' };
  } catch (error) {
    logger.error('Error refreshing S&P 500 list:', error);
    throw new Error('Unable to refresh S&P 500 list');
  }
}