// backend/src/models/trading-strategy.js
const mongoose = require('mongoose');

const TradingStrategySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  blockchain: {
    type: String,
    enum: ['ethereum', 'solana', 'binance'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'liquidity_snipe', 
      'mempool_snipe', 
      'trend_following', 
      'mean_reversion',
      'arbitrage'
    ],
    required: true
  },
  parameters: {
    maxTradeAmount: {
      type: Number,
      default: 0.1 // ETH or equivalent
    },
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
    tokenFilters: {
      minLiquidity: Number,
      maxMarketCap: Number,
      minVolume: Number
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const TradingStrategy = mongoose.model('TradingStrategy', TradingStrategySchema);

module.exports = TradingStrategy;