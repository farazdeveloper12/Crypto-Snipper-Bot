// frontend/src/components/Dashboard/TransactionTable.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  TablePagination,
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import axios from 'axios';

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async (retryCount = 3, delay = 2000) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5002/api/bot/performance', {
        params: { userId: 'default-user' },
        timeout: 5000
      });

      console.log('Fetched transactions response:', response.data);

      if (response.data && response.data.recentTrades) {
        const trades = response.data.recentTrades.map(trade => ({
          ...trade,
          id: trade.id || trade._id || `trade-${Date.now()}-${Math.random()}`, // Ensure each trade has an id
          price: trade.price || 0, // Fallback for missing price
        }));
        setTransactions(trades);
        console.log('Set transactions:', trades);
      } else {
        console.warn('No recent trades in response:', response.data);
        setTransactions([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (retryCount > 0) {
        console.log(`Retrying fetch... (${retryCount} attempts left)`);
        setTimeout(() => fetchTransactions(retryCount - 1, delay), delay);
      } else {
        setError('Failed to fetch transactions. Please try again later.');
        setTransactions([]);
        setLoading(false);
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatPrice = (price) => {
    if (!price) return '$0.00';
    if (price < 0.0001) return `$${price.toExponential(2)}`;
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(2)}`;
  };

  const getStatusChip = (status, profit) => {
    if (status === 'closed') {
      return (
        <Chip
          icon={profit > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
          label={profit > 0 ? 'Profit' : 'Loss'}
          size="small"
          color={profit > 0 ? 'success' : 'error'}
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        label="Open"
        size="small"
        color="primary"
        variant="outlined"
      />
    );
  };

  const getProfitDisplay = (trade) => {
    if (trade.status !== 'closed' || !trade.profit) return '-';
    
    const profitColor = trade.profit > 0 ? 'success.main' : 'error.main';
    const profitSign = trade.profit > 0 ? '+' : '';
    
    return (
      <Box>
        <Typography variant="body2" color={profitColor} fontWeight="bold">
          {profitSign}${Math.abs(trade.profit).toFixed(4)}
        </Typography>
        {trade.profitPercent && (
          <Typography variant="caption" color={profitColor}>
            {profitSign}{trade.profitPercent.toFixed(2)}%
          </Typography>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading transactions...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer>
        <Table sx={{ minWidth: 850 }}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Token</TableCell>
              <TableCell align="right">Amount (SOL)</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Profit/Loss</TableCell>
              <TableCell>Time</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No transactions yet. The bot will start trading meme coins soon!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tx, index) => (
                  <TableRow key={tx.id || index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Chip
                        icon={tx.action === 'buy' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                        label={tx.action.toUpperCase()}
                        size="small"
                        color={tx.action === 'buy' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, #${Math.floor(Math.random() * 16777215).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)})`,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            mr: 1.5,
                          }}
                        >
                          {tx.symbol ? tx.symbol.substring(0, 3) : '???'}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {tx.symbol || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tx.name || 'Meme Coin'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {tx.amount.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatPrice(tx.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${(tx.amount * tx.price).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(tx.status, tx.profit)}
                    </TableCell>
                    <TableCell align="right">
                      {getProfitDisplay(tx)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(tx.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View on Solscan">
                          <IconButton
                            size="small"
                            href={`https://solscan.io/tx/${tx.signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {tx.dexScreenerUrl && (
                          <Tooltip title="View on DexScreener">
                            <IconButton
                              size="small"
                              href={tx.dexScreenerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ color: '#00d4ff' }}
                            >
                              <img 
                                src="https://dexscreener.com/favicon.ico" 
                                alt="DexScreener" 
                                style={{ width: 16, height: 16 }}
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={transactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default TransactionTable;