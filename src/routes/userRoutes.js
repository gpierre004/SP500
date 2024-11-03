import express from 'express';
import { registerUser, loginUser, getUsers } from '../services/userService.js';
import { validateRequest, schemas } from '../middleware/validateRequest.js';

const router = express.Router();

router.post('/register', validateRequest(schemas.userRegister), async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const result = await registerUser(username, password, email);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', validateRequest(schemas.userLogin), async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/portfolios', async (req, res) => {
  try {
    const portfolios = await getUsers();
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;