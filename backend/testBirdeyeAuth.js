import axios from 'axios';

const BIRDEYE_API_KEY = '061ffcc15cd94df1b8cb73fc53b07079'; // Replace with your actual Birdeye API key
const BIRDEYE_API_URL = 'https://public-api.birdeye.so';

async function testBirdeyeAuth() {
  try {
    const response = await axios.get(`${BIRDEYE_API_URL}/defi/token_overview?address=So11111111111111111111111111111111111111112`, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/37.36'
      },
      timeout: 10000
    });

    console.log('Birdeye API Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error testing Birdeye API:', error.message);
    if (error.response) {
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testBirdeyeAuth();