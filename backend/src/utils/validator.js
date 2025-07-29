// src/utils/validator.js
// Validate wallet address for different blockchains

export const isValidWalletAddress = (address, chain = 'solana') => {
  if (!address) return false;

  switch (chain.toLowerCase()) {
    case 'solana':
      // Solana addresses are 44 characters base58 encoded strings
      return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(address);

    case 'ethereum':
    case 'bsc':
      // Ethereum/BSC addresses are 42 characters (0x + 40 hex characters)
      return /^0x[a-fA-F0-9]{40}$/.test(address);

    default:
      return false;
  }
};

// Validate email address
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Corrected export syntax
export default {
  isValidWalletAddress,
  isValidEmail,
  isStrongPassword
};
