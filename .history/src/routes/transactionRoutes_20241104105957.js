import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { addTransaction, createTransactionTemplate } from '../services/transactionService.js';
import { validateRequest, schemas } from '../middleware/validateRequest.js';
import path from 'path';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Existing route for single transaction
router.post('/', validateRequest(schemas.transaction), async (req, res) => {
    try {
        const result = await addTransaction(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(400).json({ error: error.message });
    }
});

// New route for bulk upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Process and validate the data
        const transactions = data.map(row => ({
            purchase_date: new Date(row['Run Date']),
            ticker: row['Symbol'].trim(),
            type: row['Action'].toLowerCase().includes('bought') ? 'buy' : 
                  row['Action'].toLowerCase().includes('sold') ? 'sell' : 'dividend',
            quantity: Math.abs(parseFloat(row['Quantity']) || 0),
            purchase_price: parseFloat(row['Price']) || 0,
            comment: row['Description'],
            portfolio_id: req.body.portfolio_id, // You'll need to pass this in the request
            current_price: parseFloat(row['Price']) || 0
        }));

        const result = await bulkUploadTransactions(transactions);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error processing file upload:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;