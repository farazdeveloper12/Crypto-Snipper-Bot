// backend/src/models/trading-preferences.js
const mongoose = require('mongoose');

const TradingPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  strategy: {
    type: String,
    enum: [
      'liquidity_snipe', 
      'mempool_snipe', 
      'trend_following', 
      'mean_reversion'
    ],
    default: 'liquidity_snipe'
  },
  riskManagement: {
    stopLossPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 5
    },
    takeProfitPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 20
    },
    maxTradeAmount: {
      type: Number,
      default: 0.1 // ETH or equivalent
    }
  },
  blockchainPreferences: [{
    blockchain: {
      type: String,
      enum: ['ethereum', 'solana', 'binance']
    },
    enabled: Boolean,
    networks: [String]
  }],
  tokenFilters: {
    minLiquidity: Number,
    maxMarketCap: Number,
    minVolume: Number
  },
  automatedSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    tradingHours: {
      start: String,
      end: String
    }
  }
}, {
  timestamps: true
});

const TradingPreferences = mongoose.model('TradingPreferences', TradingPreferencesSchema);

module.exports = TradingPreferences;