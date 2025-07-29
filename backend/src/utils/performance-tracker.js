// backend/src/utils/performance-tracker.js
const TradeHistory = require('../models/trade');

class PerformanceTracker {
  async calculateUserPerformance(userId, period = '30d') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const trades = await TradeHistory.find({
      user: userId,
      createdAt: { $gte: startDate }
    });

    const performance = {
      totalTrades: trades.length,
      profitableTrades: 0,
      totalProfit: 0,
      winRate: 0,
      averageTradeProfit: 0
    };

    trades.forEach(trade => {
      if (trade.profitLoss.percentage > 0) {
        performance.profitableTrades++;
      }
      performance.totalProfit += trade.profitLoss.amount;
    });

    performance.winRate = performance.totalTrades > 0 
      ? (performance.profitableTrades / performance.totalTrades) * 100 
      : 0;

    performance.averageTradeProfit = performance.totalTrades > 0
      ? performance.totalProfit / performance.totalTrades
      : 0;

    return performance;
  }

  async getTopPerformingStrategies(userId) {
    const strategies = await TradeHistory.aggregate([
      { $match: { user: userId } },
      { 
        $group: {
          _id: '$strategy',
          totalTrades: { $sum: 1 },
          totalProfit: { $sum: '$profitLoss.amount' },
          avgProfitPercentage: { $avg: '$profitLoss.percentage' }
        }
      },
      { $sort: { totalProfit: -1 } }
    ]);

    return strategies;
  }
}

module.exports = new PerformanceTracker();