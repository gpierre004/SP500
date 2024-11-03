import express from 'express';
import { getAllCompanies, getCompanyByTicker, refreshCompanyList } from '../services/companyService.js';

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
  try {
    const companies = await getAllCompanies();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific company by ticker
router.get('/:ticker', async (req, res) => {
  try {
    const company = await getCompanyByTicker(req.params.ticker);
    res.json(company);
  } catch (error) {
    if (error.message === 'Company not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Refresh S&P 500 list
router.post('/refresh', async (req, res) => {
  try {
    const result = await refreshCompanyList();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;