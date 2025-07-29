// src/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import authMiddleware from '../middlewares/auth.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Temporary user store (replace with MongoDB models)
let users = [];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Simple validation
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    // Add user to store (would be saved to DB in production)
    users.push(newUser);

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, username, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        },
        token
      }
    });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
});

/**
 * @route   GET /api/auth/user
 * @desc    Get user data
 * @access  Private
 */
router.get('/user', authMiddleware, (req, res) => {
  try {
    // Find user by ID
    const user = users.find(user => user.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    logger.error(`Get user error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching user data'
    });
  }
});

export default router;