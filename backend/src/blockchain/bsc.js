const Web3 = require('web3');
const config = require('../utils/config');

const BSC_RPC = config.BSC_RPC_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(BSC_RPC));

async function getAccountBalance(address) {
    try {
        const balance = await web3.eth.getBalance(address);
        return web3.utils.fromWei(balance, 'ether');
    } catch (error) {
        console.error("BSC Balance Fetch Error:", error);
        return null;
    }
}

module.exports = { web3, getAccountBalance };
