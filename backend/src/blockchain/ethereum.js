// backend/src/blockchain/ethereum.js
const Web3Config = require('./web3-config');

export const scanMempool = async () => {
  const web3 = new Web3(process.env.ETHEREUM_NODE);
  web3.eth.subscribe('pendingTransactions', async (txHash) => {
    const tx = await web3.eth.getTransaction(txHash);
    if (tx && tx.to === null) {  // Detect contract creation
      console.log("New token launch detected:", tx);
    }
  });
};


class EthereumService {
  constructor() {
    this.web3 = Web3Config.web3;
  }

  async createTransaction(from, to, amount, privateKey) {
    try {
      const tx = {
        from,
        to,
        value: this.web3.utils.toWei(amount.toString(), 'ether'),
        gas: 21000
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
      return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (error) {
      console.error('Ethereum transaction error:', error);
      throw error;
    }
  }

  async getTokenInfo(tokenAddress) {
    const tokenContract = new this.web3.eth.Contract(this.getMinimalABI(), tokenAddress);

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.methods.name().call(),
      tokenContract.methods.symbol().call(),
      tokenContract.methods.decimals().call(),
      tokenContract.methods.totalSupply().call()
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: this.web3.utils.fromWei(totalSupply, 'ether')
    };
  }

  

  // Minimal ABI for token interactions
  getMinimalABI() {
    return [
      {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        type: 'function'
      },
      {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        type: 'function'
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function'
      },
      {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function'
      }
    ];
  }
}

module.exports = new EthereumService();