// backend/testRaydium.js
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const birdeyeEndpoint = "https://public-api.birdeye.so/defi/tokenlist";

async function testBirdeye() {
  try {
    const apiKey = process.env.BIRDEYE_API_KEY;
    if (!apiKey) {
      throw new Error('Birdeye API key not found in environment variables');
    }

    console.log('Using API Key:', apiKey);

    const response = await axios.get(birdeyeEndpoint, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'x-api-key': apiKey
      }
    });
    console.log('Birdeye API Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching tokens from Birdeye:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testBirdeye();