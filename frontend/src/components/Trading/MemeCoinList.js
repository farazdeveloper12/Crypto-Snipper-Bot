// frontend/src/components/Trading/MemeCoinsList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MemeCoinsList() {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    loadCoins();
    const interval = setInterval(loadCoins, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadCoins = async () => {
    try {
      // e.g. fetch solana meme coins
      const res = await axios.get('/api/meme-coins?chain=solana&limit=20');
      if (res.data.status === 'success') {
        setCoins(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch meme coins:', err);
    }
  };

  return (
    <div>
      <h2>Real Meme Coins (DexScreener)</h2>
      <ul>
        {coins.map((c) => (
          <li key={c.address}>
            {c.symbol} - Price: ${c.price?.toFixed(6)} - Liquidity: ${c.liquidity?.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MemeCoinsList;
