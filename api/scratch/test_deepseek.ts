import * as dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load .env from api directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.DEEPSEEK_API_KEY;
const baseUrl = 'https://api.deepseek.com/v1/chat/completions';

async function testDeepSeek() {
  console.log('Testing DeepSeek API...');
  console.log('API Key present:', !!apiKey);

  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY is not set in .env');
    return;
  }

  try {
    const response = await axios.post(
      baseUrl,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, are you working?' }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('--- API Response ---');
    console.log('Status:', response.status);
    console.log('Response:', response.data.choices[0].message.content);
    console.log('--------------------');
    console.log('DeepSeek API is WORKING correctly.');
  } catch (error: any) {
    console.error('--- API Error ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
    console.log('-----------------');
    console.log('DeepSeek API is NOT working.');
  }
}

testDeepSeek();
