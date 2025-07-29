// backend/src/utils/transaction-fee-calculator.js
class TransactionFeeCalculator {
  constructor(blockchain) {
    this.blockchain = blockchain;
  }

  calculateFee(gasPrice, gasLimit, type = 'standard') {
    const feeMultipliers = {
      'standard': 1,
      'fast': 1.5,
      'slow': 0.8
    };

    const multiplier = feeMultipliers[type] || 1;

    switch(this.blockchain) {
      case 'ethereum':
        return this.calculateEthereumFee(gasPrice, gasLimit, multiplier);
      case 'solana':
        return this.calculateSolanaFee(multiplier);
      case 'binance':
        return this.calculateBinanceFee(gasPrice, gasLimit, multiplier);
      default:
        throw new Error('Unsupported blockchain');
    }
  }

  calculateEthereumFee(gasPrice, gasLimit, multiplier) {
    const adjustedGasPrice = gasPrice * multiplier;
    const totalFeeWei = adjustedGasPrice * gasLimit;
    return {
      gasPrice: adjustedGasPrice,
      gasPriceGwei: adjustedGasPrice / 1e9,
      totalFeeEth: totalFeeWei / 1e18,
      totalFeeUsd: this.convertToUSD('ethereum', totalFeeWei / 1e18)
    };
  }

  calculateSolanaFee(multiplier) {
    // Solana has fixed transaction fees
    const baseFee = 0.000005; // 5000 lamports
    return {
      fee: baseFee * multiplier,
      feeUsd: this.convertToUSD('solana', baseFee * multiplier)
    };
  }

  calculateBinanceFee(gasPrice, gasLimit, multiplier) {
    const adjustedGasPrice = gasPrice * multiplier;
    const totalFeeBNB = (adjustedGasPrice * gasLimit) / 1e18;
    return {
      gasPrice: adjustedGasPrice,
      totalFeeBNB: totalFeeBNB,
      totalFeeUsd: this.convertToUSD('binance', totalFeeBNB)
    };
  }

  convertToUSD(blockchain, amount) {
    // This would typically use a price oracle or API
    // Placeholder implementation
    const exchangeRates = {
      'ethereum': 2000, // ETH/USD
      'solana': 100,    // SOL/USD
      'binance': 300    // BNB/USD
    };

    return amount * (exchangeRates[blockchain] || 1);
  }
}

module.exports = TransactionFeeCalculator;