import express from 'express';
import { addTransaction } from '../services/transactionService.js';
import { validateRequest, schemas } from '../middleware/validateRequest.js';

const router = express.Router();

router.post('/', validateRequest(schemas.transaction), async (req, res) => {
    try {
        const result = await addTransaction(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;