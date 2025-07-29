// frontend/src/utils/validators.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number, one special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateTradeAmount = (amount, blockchain) => {
  const minAmounts = {
    'ethereum': 0.001,
    'solana': 0.01,
    'binance': 0.001
  };

  const maxAmounts = {
    'ethereum': 10,
    'solana': 100,
    'binance': 10
  };

  const parsedAmount = Number(amount);
  
  if (isNaN(parsedAmount)) return false;
  
  const min = minAmounts[blockchain] || 0.001;
  const max = maxAmounts[blockchain] || 10;

  return parsedAmount >= min && parsedAmount <= max;
};