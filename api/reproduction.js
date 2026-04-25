const axios = require('axios');

async function testSupportChat() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('--- Testing /api/support/chat ---');
    // Note: this will likely fail because it requires auth
    // But we want to see if we get the 500 configuration error
    const res = await axios.post(`${baseUrl}/api/support/chat`, {
      message: 'Hello, I need help.'
    });
    
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testSupportChat();
