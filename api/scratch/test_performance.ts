
import axios from 'axios';

async function testSearch(query: string) {
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
    console.log(`Summary length: ${JSON.stringify(response.data.summary).length}`);
  } catch (error: any) {
    const duration = Date.now() - start;
    console.log(`Error after ${duration}ms: ${error.message}`);
    if (error.response) {
      console.log('Server response:', error.response.data);
    }
  }
}

// Test with a common drug
testSearch('Aspirin');
