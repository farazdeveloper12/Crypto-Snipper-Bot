// backend/src/models/trade-history.js
const mongoose = require('mongoose');

const TradeHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    address: String,
    symbol: String,
    name: String
  },
  blockchain: {
    type: String,
    enum: ['ethereum', 'solana', 'binance']
  },
  tradeType: {
    type: String,
    enum: ['buy', 'sell']
  },
  amount: {
    type: Number,
    required: true
  },
  price: {
    entry: Number,
    exit: Number
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  strategy: String,
  profitLoss: {
    percentage: Number,
    amount: Number
  },
  metadata: {
    entryTimestamp: Date,
    exitTimestamp: Date,
    transactionHash: String
  }
}, {
  timestamps: true
});

const TradeHistory = mongoose.model('TradeHistory', TradeHistorySchema);

module.exports = TradeHistory;