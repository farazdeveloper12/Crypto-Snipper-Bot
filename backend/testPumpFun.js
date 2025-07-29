// backend/testPumpFun.js
import axios from 'axios';

const pumpFunEndpoint = "https://api.pump.fun/coins?limit=10&offset=0&sort=created_timestamp&order=desc";

async function testPumpFun() {
  try {
    const response = await axios.get(pumpFunEndpoint, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log('PumpFun API Response:', response.data);
  } catch (error) {
    console.error('Error fetching tokens from PumpFun:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testPumpFun();