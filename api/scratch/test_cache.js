
const axios = require('axios');

async function testSearch(query) {
  const start = Date.now();
  console.log(`Testing search for: ${query}`);
  try {
    const response = await axios.post('http://localhost:3001/api/search', {
      query,
      eli12: false
    }, {
      timeout: 30000 // 30s timeout
    });
    const duration = Date.now() - start;
    console.log(`Success! Status: ${response.status}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`AI Provider: ${response.data.ai_provider}`);
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`Error after ${duration}ms: ${error.message}`);
  }
}

async function run() {
  console.log('--- FIRST SEARCH (Should take a few seconds) ---');
  await testSearch('Aspirin');
  
  console.log('\n--- SECOND SEARCH (Should be near instant) ---');
  await testSearch('Aspirin');
}

run();
