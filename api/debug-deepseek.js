const axios = require('axios');
require('dotenv').config();

async function testDeepSeek() {
  const apiKey = 'sk-94f377dcbf39421ba66956ef81eff46e';
  const baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  console.log('Testing DeepSeek API Key:', apiKey);

  try {
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
