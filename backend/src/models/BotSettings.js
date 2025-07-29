// src/models/BotSettings.js
import mongoose from 'mongoose';

const BotSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  maxTradeAmount: {
    type: Number,
    default: 0.1,
    min: 0.01,
    max: 10
  },
  slippage: {
    type: Number,
    default: 3,
    min: 0.1,
    max: 50
  },
  takeProfit: {
    type: Number,
    default: 50,
    min: 1,
    max: 1000
  },
  stopLoss: {
    type: Number,
    default: 10,
    min: 1,
    max: 99
  },
  gasLimit: {
    type: Number,
    default: 300000,
    min: 100000
  },
  scamCheck: {
    type: Boolean,
    default: true
  },
  antiRugPull: {
    type: Boolean,
    default: true
  },
  frontRunProtection: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Check if model exists before creating it
const BotSettings = mongoose.models.BotSettings || mongoose.model('BotSettings', BotSettingsSchema);

export default BotSettings;