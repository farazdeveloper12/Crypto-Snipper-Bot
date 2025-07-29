// src/models/Strategy.js
import mongoose from 'mongoose';

const StrategySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenAddress: {
    type: String,
    required: true
  },
  tokenSymbol: String,
  tokenName: String,
  entryTxHash: String,
  entryAmount: {
    type: Number,
    required: true
  },
  entryPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  profitPercentage: {
    type: Number,
    default: 0
  },
  takeProfitPrice: Number,
  stopLossPrice: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  exitReason: {
    type: String,
    enum: ['take_profit', 'stop_loss', 'manual', 'error'],
    default: null
  },
  exitTxHash: String,
  exitPrice: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date
});

// Add indexes for performance
StrategySchema.index({ userId: 1, isActive: 1 });
StrategySchema.index({ tokenAddress: 1 });

// Check if model exists before creating it
const Strategy = mongoose.models.Strategy || mongoose.model('Strategy', StrategySchema);

export default Strategy;