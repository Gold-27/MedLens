
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../api/.env') });

async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  console.log('Testing DeepSeek with API Key starting with:', apiKey ? apiKey.substring(0, 5) : 'MISSING');
  
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    console.log('DeepSeek Success:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('DeepSeek Error:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
    }
  }
}

testDeepSeek();
