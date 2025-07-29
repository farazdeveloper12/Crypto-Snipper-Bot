// backend/src/utils/sentiment-analyzer.js
const axios = require('axios');
const natural = require('natural');

class SentimentAnalyzer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.sentiment = new natural.SentimentAnalyzer(
      "English", 
      natural.PorterStemmer, 
      "afinn"
    );
  }

  async analyzeSocialMediaSentiment(query) {
    const sources = [
      this.analyzeTweets(query),
      this.analyzeRedditPosts(query),
      this.analyzeTelegramChats(query)
    ];

    const sentiments = await Promise.all(sources);
    
    return this.aggregateSentiments(sentiments);
  }

  async analyzeTweets(query) {
    try {
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        params: { query },
        headers: { 
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}` 
        }
      });

      return this.calculateSentiment(
        response.data.data.map(tweet => tweet.text)
      );
    } catch (error) {
      console.error('Twitter sentiment analysis failed', error);
      return 0;
    }
  }

  async analyzeRedditPosts(query) {
    // Similar implementation for Reddit
    return 0;
  }

  async analyzeTelegramChats(query) {
    // Similar implementation for Telegram
    return 0;
  }

  calculateSentiment(texts) {
    const sentiments = texts.map(text => {
      const tokens = this.tokenizer.tokenize(text);
      return this.sentiment.getSentiment(tokens);
    });

    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    
    // Normalize to -1 to 1 scale
    return Math.min(Math.max(avgSentiment, -1), 1);
  }

  aggregateSentiments(sentiments) {
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    return {
      score: avgSentiment,
      interpretation: this.interpretSentiment(avgSentiment)
    };
  }

  interpretSentiment(score) {
    if (score > 0.5) return 'Very Positive';
    if (score > 0) return 'Positive';
    if (score === 0) return 'Neutral';
    if (score > -0.5) return 'Negative';
    return 'Very Negative';
  }
}

module.exports = new SentimentAnalyzer();