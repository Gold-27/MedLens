const axios = require('axios');

async function checkBalance() {
  const apiKey = 'sk-ada9dbdc1dca4b7da7a6d835d01ede77';
  const url = 'https://api.deepseek.com/user/balance';

  console.log('Checking DeepSeek balance for key:', apiKey);

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('--- BALANCE INFO ---');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('--- FAILED TO CHECK BALANCE ---');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

checkBalance();
