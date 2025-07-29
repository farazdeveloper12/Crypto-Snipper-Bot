// backend/src/utils/risk-scoring.js
class RiskScorer {
  constructor() {
    this.riskFactors = {
      marketCap: { weight: 0.2, scoreFunction: this.marketCapRisk },
      volume: { weight: 0.15, scoreFunction: this.volumeRisk },
      tokenAge: { weight: 0.15, scoreFunction: this.tokenAgeRisk },
      holderDistribution: { weight: 0.2, scoreFunction: this.holderDistributionRisk },
      contractVerification: { weight: 0.15, scoreFunction: this.contractVerificationRisk },
      tradingHistory: { weight: 0.15, scoreFunction: this.tradingHistoryRisk }
    };
  }

  calculateRiskScore(tokenMetrics) {
    let totalRiskScore = 0;

    for (const [factor, config] of Object.entries(this.riskFactors)) {
      const factorScore = config.scoreFunction(tokenMetrics[factor]);
      totalRiskScore += factorScore * config.weight;
    }

    return Math.min(Math.max(totalRiskScore, 0), 1);
  }

  marketCapRisk(marketCap) {
    // Lower market cap = higher risk
    if (marketCap < 1_000_000) return 1;
    if (marketCap < 10_000_000) return 0.7;
    if (marketCap < 100_000_000) return 0.4;
    return 0.1;
  }

  volumeRisk(volume24h) {
    // Low volume = higher risk
    if (volume24h < 10_000) return 1;
    if (volume24h < 100_000) return 0.7;
    if (volume24h < 1_000_000) return 0.4;
    return 0.1;
  }

  tokenAgeRisk(createdAt) {
    const ageInDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    
    if (ageInDays < 30) return 1;
    if (ageInDays < 90) return 0.7;
    if (ageInDays < 180) return 0.4;
    return 0.1;
  }

  holderDistributionRisk(holderMetrics) {
    // Check concentration of tokens
    if (holderMetrics.topHolderPercentage > 50) return 1;
    if (holderMetrics.topHolderPercentage > 30) return 0.7;
    if (holderMetrics.topHolderPercentage > 20) return 0.4;
    return 0.1;
  }

  contractVerificationRisk(isVerified) {
    return isVerified ? 0.1 : 1;
  }

  tradingHistoryRisk(tradingHistory) {
    // Analyze trading patterns
    if (tradingHistory.suspiciousTransactions > 10) return 1;
    if (tradingHistory.suspiciousTransactions > 5) return 0.7;
    if (tradingHistory.suspiciousTransactions > 0) return 0.4;
    return 0.1;
  }
}

module.exports = new RiskScorer();