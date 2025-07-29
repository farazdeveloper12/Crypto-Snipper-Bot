// backend/src/blockchain/web3-config.js
const { web3: ethereumWeb3 } = require('./ethereum');
const { web3: solanaWeb3 } = require('./solana');
const { web3: bscWeb3 } = require('./bsc'); // Add this line

module.exports = { ethereumWeb3, solanaWeb3, bscWeb3 };

const Web3 = require('web3');
const { Connection } = require('@solana/web3.js');
require('dotenv').config();

export const DEX_PROVIDERS = {
  uniswap: "https://api.uniswap.org/",
  pancakeswap: "https://api.pancakeswap.info/api/v2/tokens",
  raydium: "https://api.raydium.io/pairs"
};


class Web3Config {
  constructor() {
    // Ethereum Configuration
    this.ethereumProvider = new Web3.providers.HttpProvider(
      process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'
    );
    this.web3 = new Web3(this.ethereumProvider);

    // Solana Configuration
    this.solanaConnection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
  }

  // Ethereum methods
  async getEthereumNetworkId() {
    return await this.web3.eth.net.getId();
  }

  async getEthereumBalance(address) {
    const balanceWei = await this.web3.eth.getBalance(address);
    return this.web3.utils.fromWei(balanceWei, 'ether');
  }

  // Solana methods
  async getSolanaBalance(publicKey) {
    const balance = await this.solanaConnection.getBalance(publicKey);
    return balance / 1_000_000_000; // Convert lamports to SOL
  }

  // Utility methods
  toChecksumAddress(address) {
    return this.web3.utils.toChecksumAddress(address);
  }
}

module.exports = new Web3Config();