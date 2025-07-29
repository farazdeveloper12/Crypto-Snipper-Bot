# ml-models/market-prediction/model.py
import tensorflow as tf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

class MarketPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()

    def load_and_prepare_data(self, csv_path):
        """
        Load and prepare market data for prediction
        """
        # Load historical price data
        df = pd.read_csv(csv_path)
        
        # Select relevant features
        features = ['open', 'high', 'low', 'volume']
        target = 'close'
        
        # Prepare input features and target
        X = df[features].values
        y = df[target].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Create sequences for LSTM
        def create_sequences(X, y, time_steps=60):
            X_seq, y_seq = [], []
            for i in range(len(X) - time_steps):
                X_seq.append(X[i:i+time_steps])
                y_seq.append(y[i+time_steps])
            return np.array(X_seq), np.array(y_seq)
        
        X_sequences, y_sequences = create_sequences(X_scaled, y)
        
        return train_test_split(
            X_sequences, y_sequences, 
            test_size=0.2, 
            random_state=42
        )

    def create_model(self, input_shape):
        """
        Create LSTM-based price prediction model
        """
        model = tf.keras.Sequential([
            tf.keras.layers.LSTM(50, return_sequences=True, input_shape=input_shape),
            tf.keras.layers.LSTM(50),
            tf.keras.layers.Dense(25),
            tf.keras.layers.Dense(1)
        ])
        
        model.compile(
            optimizer='adam', 
            loss='mean_squared_error',
            metrics=['mae']
        )
        
        return model

    def train(self, csv_path):
        """
        Train market prediction model
        """
        X_train, X_test, y_train, y_test = self.load_and_prepare_data(csv_path)
        
        # Create model
        self.model = self.create_model(X_train.shape[1:])
        
        # Train
        history = self.model.fit(
            X_train, y_train, 
            epochs=50, 
            batch_size=32, 
            validation_split=0.2,
            verbose=1
        )
        
        # Evaluate
        loss, mae = self.model.evaluate(X_test, y_test)
        print(f"Test Loss: {loss}, MAE: {mae}")
        
        return history

    def predict(self, input_sequence):
        """
        Predict next price based on input sequence
        """
        # Scale input if not already scaled
        if input_sequence.ndim == 2:
            input_sequence = self.scaler.transform(input_sequence)
        
        # Reshape for LSTM
        input_sequence = input_sequence.reshape(1, input_sequence.shape[0], input_sequence.shape[1])
        
        # Predict
        prediction = self.model.predict(input_sequence)
        
        # Inverse transform to get actual price
        return self.scaler.inverse_transform(prediction)[0][0]

# Usage
if __name__ == "__main__":
    model = MarketPredictionModel()
    model.train('market_data.csv')