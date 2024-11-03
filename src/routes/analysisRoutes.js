import express from 'express';
import { getWatchListCandidates } from '../services/analysisService.js';

const router = express.Router();

// New route to get potential watch list candidates
router.get('/watch-list-candidates', async (req, res) => {
  try {
    // Log the user information from the request
    console.log(`User requesting watch list candidates: ${JSON.stringify(req.user)}`);

    const candidates = await getWatchListCandidates();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;