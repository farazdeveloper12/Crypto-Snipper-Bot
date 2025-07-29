// frontend/src/components/Trading/DexPairsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function DexPairsList() {
  const [pairs, setPairs] = useState([]);
  const [chain, setChain] = useState('solana');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchPairs();
    const interval = setInterval(fetchPairs, 30_000); // Poll every 30s
    return () => clearInterval(interval);
  }, [chain, limit]);

  const fetchPairs = async () => {
    try {
      const response = await axios.get(
        `/api/dex/pairs?chain=${chain}&limit=${limit}`
      );
      if (response.data.status === 'success') {
        setPairs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch Dex pairs:', error);
    }
  };

  return (
    <div>
      <h2>DexScreener Pairs ({chain})</h2>
      <label>Chain:</label>
      <select value={chain} onChange={(e) => setChain(e.target.value)}>
        <option value="solana">Solana</option>
        <option value="bsc">BSC</option>
        <option value="ethereum">Ethereum</option>
        {/* Add more chains if needed */}
      </select>

      <label>Limit:</label>
      <input
        type="number"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
        style={{ width: '60px', marginLeft: '8px' }}
      />

      <ul>
        {pairs.map((p) => (
          <li key={p.pairAddress}>
            {p.baseToken.symbol} / {p.quoteToken.symbol} - ${p.priceUsd?.toFixed(6)} - 
            Liquidity: ${p.liquidity?.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DexPairsList;
