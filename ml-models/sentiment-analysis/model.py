# ml-models/sentiment-analysis/model.py
import tensorflow as tf
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from textblob import TextBlob

def analyze_sentiment(text):
    analysis = TextBlob(text)
    return analysis.sentiment.polarity


class SentimentAnalysisModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()

    def load_data(self, csv_path):
        """
        Load and preprocess sentiment data
        """
        df = pd.read_csv(csv_path)
        X = df['text'].values
        y = df['sentiment'].values
        
        # Tokenize and pad text
        tokenizer = tf.keras.preprocessing.text.Tokenizer(num_words=5000)
        tokenizer.fit_on_texts(X)
        X_seq = tokenizer.texts_to_sequences(X)
        X_pad = tf.keras.preprocessing.sequence.pad_sequences(X_seq, maxlen=100)
        
        return X_pad, y

    def create_model(self):
        """
        Create sentiment analysis neural network
        """
        model = tf.keras.Sequential([
            tf.keras.layers.Embedding(5000, 32, input_length=100),
            tf.keras.layers.LSTM(64),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam', 
            loss='binary_crossentropy', 
            metrics=['accuracy']
        )
        
        return model

    def train(self, csv_path):
        """
        Train sentiment analysis model
        """
        X, y = self.load_data(csv_path)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Create and train model
        self.model = self.create_model()
        history = self.model.fit(
            X_train, y_train, 
            epochs=10, 
            validation_split=0.2,
            batch_size=32
        )
        
        # Evaluate model
        test_loss, test_accuracy = self.model.evaluate(X_test, y_test)
        print(f"Test Accuracy: {test_accuracy}")
        
        return history

    def predict(self, texts):
        """
        Predict sentiment for given texts
        """
        # Tokenize and pad texts
        tokenizer = tf.keras.preprocessing.text.Tokenizer(num_words=5000)
        tokenizer.fit_on_texts(texts)
        text_seq = tokenizer.texts_to_sequences(texts)
        text_pad = tf.keras.preprocessing.sequence.pad_sequences(text_seq, maxlen=100)
        
        # Predict
        predictions = self.model.predict(text_pad)
        return predictions

# Usage
if __name__ == "__main__":
    model = SentimentAnalysisModel()
    model.train('sentiment_data.csv')