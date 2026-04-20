const axios = require('axios');

async function testApi() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('--- Testing /api/search (Aspirin) ---');
    const searchRes = await axios.post(`${baseUrl}/api/search`, {
      query: 'Aspirin'
    });
    
    console.log('Search Status:', searchRes.status);
    console.log('Drug Name:', searchRes.data.drug_name);
    console.log('AI Provider:', searchRes.data.ai_provider);
    console.log('Summary (Layer 1):', JSON.stringify(searchRes.data.summary, null, 2));
    
    if (searchRes.data.ai_provider !== 'DeepSeek') {
      console.warn('WARNING: AI Provider is not DeepSeek!');
    }

    const drugData = searchRes.data.data;
    const currentSummary = searchRes.data.summary;

    console.log('\n--- Testing /api/eli12 ---');
    const eliRes = await axios.post(`${baseUrl}/api/eli12`, {
      drug_data: drugData,
      current_summary: currentSummary
    });
    
    console.log('ELI12 Status:', eliRes.status);
    console.log('AI Provider:', eliRes.data.ai_provider);
    console.log('ELI12 Summary (Layer 2):', JSON.stringify(eliRes.data.summary, null, 2));

    if (eliRes.data.ai_provider.includes('DeepSeek')) {
      console.log('\nSUCCESS: AI Pipeline is working correctly with DeepSeek.');
    } else {
      console.warn('\nWARNING: ELI12 AI Provider is not DeepSeek!');
    }

  } catch (error) {
    console.error('API Test Failed:', error.response ? error.response.data : error.message);
  }
}

testApi();
