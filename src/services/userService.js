import { User } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

export async function registerUser(username, password, email) {
  try {
    const user = await User.create({ username, password, email });
    const token = generateToken(user);
    return { token };
  } catch (error) {
    logger.error('Error registering user:', error);
    throw new Error('Unable to register user');
  }
}

export async function loginUser(username, password) {
  try {
    logger.info(`Login attempt for user: ${username}`);
    const user = await User.findOne({ where: { username } });
    if (!user) {
      logger.warn(`Login failed: User not found - ${username}`);
      throw new Error('Invalid credentials');
    }
    logger.info(`User found: ${user.username}`);
    const isValidPassword = await bcrypt.compare(password, user.password);
    logger.info(`Password validation result: ${isValidPassword}`);
    if (isValidPassword) {
      const token = generateToken(user);
      logger.info(`Login successful for user: ${username}`);
      return { token };
    } else {
      logger.warn(`Login failed: Invalid password for user - ${username}`);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    logger.error('Error logging in user:', error);
    throw new Error('Unable to log in');
  }
}

export async function getUsers() {
  try {
    const portfolios = await User.findAll({
      attributes: ['id', 'username'],
      where: {
        username: {
          [Op.notLike]: 'dummyuser%'
        }
      },
      order: [['id', 'ASC']]
    });
    return portfolios;
  } catch (error) {
    logger.error('Error fetching portfolios:', error);
    throw new Error('Unable to fetch portfolios');
  }
}