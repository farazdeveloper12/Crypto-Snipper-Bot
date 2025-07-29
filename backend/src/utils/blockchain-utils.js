// backend/src/utils/blockchain-utils.js
const Web3 = require('web3');
const { Connection, PublicKey } = require('@solana/web3.js');

class BlockchainUtils {
  static validateEthereumAddress(address) {
    // Ethereum address validation
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  }

  static validateSolanaAddress(address) {
    // Solana address validation
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return solanaAddressRegex.test(address);
  }

  static async estimateGasFee(web3Instance, transaction) {
    try {
      const gasPrice = await web3Instance.eth.getGasPrice();
      const gasLimit = await web3Instance.eth.estimateGas(transaction);
      
      return {
        gasPrice: web3Instance.utils.fromWei(gasPrice, 'gwei'),
        gasLimit,
        totalFee: web3Instance.utils.fromWei(
          (gasPrice * gasLimit).toString(), 
          'ether'
        )
      };
    } catch (error) {
      console.error('Gas fee estimation failed', error);
      throw error;
    }
  }

  static generateWallet(blockchain) {
    switch(blockchain) {
      case 'ethereum':
        const ethAccount = Web3.eth.accounts.create();
        return {
          address: ethAccount.address,
          privateKey: ethAccount.privateKey
        };
      case 'solana':
        // Solana wallet generation
        const solanaKeypair = Keypair.generate();
        return {
          address: solanaKeypair.publicKey.toString(),
          privateKey: solanaKeypair.secretKey.toString('hex')
        };
      default:
        throw new Error('Unsupported blockchain');
    }
  }
}

module.exports = BlockchainUtils;