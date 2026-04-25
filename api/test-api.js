const axios = require('axios');

async function testAPI() {
  console.log('Testing MedQuire API endpoints...\n');
  
  // Test health endpoint
  try {
    const healthRes = await axios.get('http://localhost:3001/health');
    console.log('✓ Health endpoint:', healthRes.data);
  } catch (error) {
    console.log('✗ Health endpoint failed:', error.message);
    return;
  }
  
  // Test autocomplete endpoint
  try {
    const autoRes = await axios.get('http://localhost:3001/api/autocomplete?q=ibuprofen');
    console.log('\n✓ Autocomplete endpoint (ibuprofen):', {
      query: autoRes.data.query,
      suggestionsCount: autoRes.data.suggestions?.length || 0
    });
  } catch (error) {
    console.log('\n✗ Autocomplete endpoint failed:', error.message);
  }
  
  // Test search endpoint (mock since we don't have real API keys)
  try {
    const searchRes = await axios.post('http://localhost:3001/api/search', { query: 'ibuprofen' });
    console.log('\n✓ Search endpoint (ibuprofen):', {
      drug_name: searchRes.data.drug_name,
      source: searchRes.data.source,
      hasSummary: !!searchRes.data.summary
    });
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('\n✓ Search endpoint (ibuprofen): Medication not found (expected without OpenFDA key)');
    } else {
      console.log('\n✗ Search endpoint failed:', error.message);
    }
  }
  
  // Test interactions endpoint
  try {
    const interactRes = await axios.post('http://localhost:3001/api/interactions', { 
      drug_keys: ['ibuprofen', 'aspirin'] 
    });
    console.log('\n✓ Interactions endpoint:', {
      status: interactRes.data.status,
      message: interactRes.data.message
    });
  } catch (error) {
    console.log('\n✗ Interactions endpoint failed:', error.message);
  }
  
  console.log('\n✅ API testing completed!');
}

// Check if server is running
axios.get('http://localhost:3001/health')
  .then(() => {
    testAPI();
  })
  .catch(err => {
    console.log('Server not running on port 3001. Please start the backend first.');
    process.exit(1);
  });