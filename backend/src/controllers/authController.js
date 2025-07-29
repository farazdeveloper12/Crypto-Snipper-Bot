// src/controllers/authController.js
import User from '../models/User.js';
import BotSettings from '../models/BotSettings.js';
import { logger } from '../utils/logger.js';
import { isValidEmail, isStrongPassword } from '../utils/validator.js';

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }
    
    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create user
    const user = new User({
      name,
      email,
      password
    });
    
    await user.save();
    
    // Create default bot settings
    await BotSettings.create({
      userId: user._id
    });
    
    // Generate token
    const token = user.generateAuthToken();
    
    logger.info(`New user registered: ${user._id}`);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    
    // Generate token
    const token = user.generateAuthToken();
    
    logger.info(`User logged in: ${user._id}`);
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletCount: user.walletAddresses.length
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        wallets: user.walletAddresses.map((w, i) => ({
          index: i,
          chain: w.chain,
          address: w.address,
          label: w.label
        })),
        lastLogin: user.lastLoginAt
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;
    
    if (name) {
      user.name = name;
    }
    
    await user.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile
};