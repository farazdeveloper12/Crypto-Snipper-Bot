// backend/src/controllers/user-controller.js
const UserModel = require('../models/user');
const Logger = require('../utils/logger');
const { encryptWallet } = require('../utils/encryption');

class UserController {
  constructor() {
    this.logger = new Logger('user-controller');
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, username } = req.body;

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.user.id, 
        {
          'profile.firstName': firstName,
          'profile.lastName': lastName,
          'profile.username': username
        },
        { new: true }
      );

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstName: updatedUser.profile.firstName,
          lastName: updatedUser.profile.lastName,
          username: updatedUser.profile.username
        }
      });
    } catch (error) {
      this.logger.error('Profile update failed', error);
      res.status(500).json({ 
        error: 'Profile update failed', 
        details: error.message 
      });
    }
  }

  // Add wallet address
  async addWallet(req, res) {
    try {
      const { blockchain, address, privateKey } = req.body;

      // Encrypt private key
      const encryptedPrivateKey = await encryptWallet(privateKey);

      const updateQuery = blockchain === 'ethereum' 
        ? { 
            'wallet.ethereum.address': address,
            'wallet.ethereum.privateKeyEncrypted': encryptedPrivateKey 
          }
        : {
            'wallet.solana.address': address,
            'wallet.solana.privateKeyEncrypted': encryptedPrivateKey
          };

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.user.id, 
        updateQuery,
        { new: true }
      );

      res.json({
        message: 'Wallet added successfully',
        wallet: blockchain === 'ethereum' 
          ? updatedUser.wallet.ethereum 
          : updatedUser.wallet.solana
      });
    } catch (error) {
      this.logger.error('Wallet addition failed', error);
      res.status(500).json({ 
        error: 'Wallet addition failed', 
        details: error.message 
      });
    }
  }

 // backend/src/controllers/user-controller.js
async updateTradingPreferences(req, res) {
  try {
    const { 
      defaultStrategy, 
      riskTolerance, 
      maxTradeAmount 
    } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id, 
      {
        'trading.defaultStrategy': defaultStrategy,
        'trading.riskTolerance': riskTolerance,
        'trading.maxTradeAmount': maxTradeAmount
      },
      { new: true }
    );

    res.json({
      message: 'Trading preferences updated successfully',
      trading: updatedUser.trading
    });
  } catch (error) {
    this.logger.error('Trading preferences update failed', error);
    res.status(500).json({ 
      error: 'Trading preferences update failed', 
      details: error.message 
    });
  }
}

// Update notification preferences
async updateNotificationPreferences(req, res) {
  try {
    const { 
      emailTradeAlerts, 
      emailRiskAlerts, 
      smsEnabled,
      phoneNumber 
    } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id, 
      {
        'notifications.email.tradeAlerts': emailTradeAlerts,
        'notifications.email.riskAlerts': emailRiskAlerts,
        'notifications.sms.enabled': smsEnabled,
        'notifications.sms.phoneNumber': phoneNumber
      },
      { new: true }
    );

    res.json({
      message: 'Notification preferences updated successfully',
      notifications: updatedUser.notifications
    });
  } catch (error) {
    this.logger.error('Notification preferences update failed', error);
    res.status(500).json({ 
      error: 'Notification preferences update failed', 
      details: error.message 
    });
  }
}

// Enable two-factor authentication
async enableTwoFactor(req, res) {
  try {
    const { secret } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      {
        'security.twoFactorEnabled': true,
        'security.twoFactorSecret': secret
      },
      { new: true }
    );

    res.json({
      message: 'Two-factor authentication enabled',
      twoFactorEnabled: true
    });
  } catch (error) {
    this.logger.error('Two-factor authentication setup failed', error);
    res.status(500).json({ 
      error: 'Two-factor authentication setup failed', 
      details: error.message 
    });
  }
}

// Get user profile
async getProfile(req, res) {
  try {
    const user = await UserModel.findById(req.user.id)
      .select('-password -security.twoFactorSecret');

    res.json({
      profile: {
        id: user._id,
        email: user.email,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        username: user.profile.username,
        trading: user.trading,
        notifications: user.notifications,
        subscriptionTier: user.subscriptionTier
      }
    });
  } catch (error) {
    this.logger.error('Profile fetch failed', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile', 
      details: error.message 
    });
  }
}
}

module.exports = new UserController();