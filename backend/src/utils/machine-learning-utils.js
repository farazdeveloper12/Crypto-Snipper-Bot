// backend/src/utils/machine-learning-utils.js
const tf = require('@tensorflow/tfjs-node');
const axios = require('axios');

class MachineLearningUtils {
  async preprocessMarketData(rawData) {
    // Preprocess market data for ML models
    const features = rawData.map(entry => [
      entry.open,
      entry.high,
      entry.low,
      entry.close,
      entry.volume
    ]);

    return tf.tensor2d(features);
  }

  async fetchHistoricalPriceData(tokenAddress, blockchain, timeframe = '1d') {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${blockchain}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: timeframe === '1d' ? 1 : 30
        }
      });

      return response.data.prices;
    } catch (error) {
      console.error('Failed to fetch historical price data', error);
      return [];
    }
  }

  async trainPredictionModel(historicalData) {
    // Create a simple LSTM model for price prediction
    const model = tf.sequential();

    model.add(tf.layers.lstm({
      units: 50,
      inputShape: [historicalData.shape[1], historicalData.shape[2]]
    }));

    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    // Train the model
    await model.fit(historicalData, {
      epochs: 100,
      batchSize: 32
    });

    return model;
  }

  async predictNextDayPrice(model, latestData) {
    const prediction = model.predict(latestData);
    return prediction.dataSync()[0];
  }
}

module.exports = new MachineLearningUtils();