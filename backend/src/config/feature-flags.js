// backend/src/config/feature-flags.js
class FeatureFlags {
  constructor() {
    this.flags = {
      // Trading features
      LIQUIDITY_SNIPING_ENABLED: process.env.FEATURE_LIQUIDITY_SNIPING === 'true',
      MEMPOOL_SNIPING_ENABLED: process.env.FEATURE_MEMPOOL_SNIPING === 'true',
      
      // AI/ML features
      SENTIMENT_ANALYSIS_ENABLED: process.env.FEATURE_SENTIMENT_ANALYSIS === 'true',
      MARKET_PREDICTION_ENABLED: process.env.FEATURE_MARKET_PREDICTION === 'true',
      
      // Security features
      TWO_FACTOR_AUTH_REQUIRED: process.env.SECURITY_TWO_FACTOR_REQUIRED === 'true',
      IP_WHITELIST_ENABLED: process.env.SECURITY_IP_WHITELIST === 'true',
      
      // Performance features
      CACHING_ENABLED: process.env.PERFORMANCE_CACHING === 'true',
      RATE_LIMITING_ENABLED: process.env.PERFORMANCE_RATE_LIMITING === 'true'
    };
  }

  isEnabled(feature) {
    return this.flags[feature] || false;
  }

  getFeatureStatus() {
    return { ...this.flags };
  }
}

module.exports = new FeatureFlags();