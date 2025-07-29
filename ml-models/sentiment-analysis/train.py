# ml-models/train.py
import os
from sentiment_analysis.model import SentimentAnalysisModel
from market_prediction.model import MarketPredictionModel

def main():
    # Sentiment Analysis Model Training
    print("Training Sentiment Analysis Model...")
    sentiment_model = SentimentAnalysisModel()
    sentiment_model.train('data/sentiment_data.csv')
    sentiment_model.model.save('models/sentiment_model.h5')

    # Market Prediction Model Training
    print("Training Market Prediction Model...")
    market_model = MarketPredictionModel()
    market_model.train('data/market_data.csv')
    market_model.model.save('models/market_prediction_model.h5')

if __name__ == "__main__":
    main()