import express from 'express';
import { updateWatchList, cleanupWatchList, getWatchList } from '../services/watchlistService.js';

const router = express.Router();

// Get watch list (no authentication for testing)
router.get('/', async (req, res) => {
  try {
    // For testing, use a dummy user ID
    const dummyUserId = 1;
    const watchList = await getWatchList(dummyUserId);
    res.json(watchList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update watch list (no authentication for testing)
router.post('/update', async (req, res) => {
  try {
    // For testing, use a dummy user ID
    const dummyUserId = 1;
    const result = await updateWatchList(dummyUserId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup watch list (no authentication for testing)
router.post('/cleanup', async (req, res) => {
  try {
    const result = await cleanupWatchList();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;