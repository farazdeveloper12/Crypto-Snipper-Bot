# backend/ai/scripts/preprocess.py
import pandas as pd
import numpy as np

def preprocess_data(raw_data):
    # Raw data ko DataFrame mein convert karein
    df = pd.DataFrame(raw_data)
    # Price aur volume ko float mein convert karein
    df['price'] = df['price'].astype(float)
    df['volume'] = df['volume'].astype(float)
    # Missing values ko 0 se fill karein
    df = df.fillna(0)
    # Moving average feature add karein
    df['price_ma_5'] = df['price'].rolling(window=5).mean()
    return df

# Test karne ke liye
if __name__ == "__main__":
    raw_data = [{'price': 100, 'volume': 1000}, {'price': 105, 'volume': 1200}]
    processed = preprocess_data(raw_data)
    print(processed)