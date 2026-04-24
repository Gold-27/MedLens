const axios = require('axios');
require('dotenv').config();

async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  if (!apiKey) {
    console.log('DEEPSEEK_API_KEY is not set in .env');
    return;
  }

  try 
    const response = await axios.post(
    baseUrl,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'Say hello' }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );

  console.log('--- SUCCESS ---');
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));
} catch (error) {
  console.log('--- FAILED ---');
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.log('Error Message:', error.message);
  }
}
}

testDeepSeek();
