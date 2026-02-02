// Quick test script for the API
const axios = require('axios');

const API_URL = 'https://super-app-blue-pi.vercel.app/api/extract';

async function testAPI() {
  console.log('Testing API:', API_URL);
  console.log('---');

  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/abc123'
  ];

  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    try {
      const response = await axios.post(API_URL, { url }, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✓ Success!');
      console.log('  Title:', response.data.title);
      console.log('  Platform:', response.data.platform);
      console.log('  Qualities:', response.data.qualities.length);
      console.log('  Audio formats:', response.data.audioFormats.length);
    } catch (error) {
      console.log('✗ Failed:', error.message);
      if (error.response) {
        console.log('  Status:', error.response.status);
        console.log('  Data:', error.response.data);
      }
    }
  }
}

testAPI();
