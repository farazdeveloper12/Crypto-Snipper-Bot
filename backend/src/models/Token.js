// src/models/Token.js
import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  chain: {
    type: String,
    enum: ['solana', 'ethereum', 'bsc'],
    required: true
  },
  decimals: {
    type: Number,
    required: true,
    default: 18
  },
  price: {
    type: Number,
    default: 0
  },
  priceChange24h: {
    type: Number,
    default: 0
  },
  marketCap: {
    type: Number,
    default: 0
  },
  volume24h: {
    type: Number,
    default: 0
  },
  liquidity: {
    type: Number,
    default: 0
  },
  holders: {
    type: Number,
    default: 0
  },
  launchDate: {
    type: Date,
    default: Date.now
  },
  dex: {
    type: String,
    enum: ['uniswap', 'pancakeswap', 'raydium', 'other'],
    default: 'other'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  securityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  isScam: {
    type: Boolean,
    default: false
  },
  scamIndicators: [{
    type: String
  }],
  socialLinks: {
    website: String,
    twitter: String,
    telegram: String,
    discord: String,
    github: String
  },
  logoUrl: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
tokenSchema.index({ address: 1, chain: 1 }, { unique: true });
tokenSchema.index({ symbol: 1 });
tokenSchema.index({ launchDate: -1 });

const Token = mongoose.model('Token', tokenSchema);

export default Token;