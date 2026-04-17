const axios = require('axios');

async function testOpenFDA() {
  const query = 'advil'; // Brand name. Generic name is Ibuprofen.
  const encodedQuery = encodeURIComponent(`"${query}"`);
  const baseUrl = 'https://api.fda.gov/drug/label.json';
  
  // Test 1: Old syntax (AND) - Likely fails for Advil if it doesn't match generic
  const urlAnd = `${baseUrl}?search=openfda.brand_name:"${query}"+openfda.generic_name:"${query}"&limit=1`;
  
  // Test 2: New syntax (OR)
  const urlOr = `${baseUrl}?search=openfda.brand_name:${encodedQuery}+OR+openfda.generic_name:${encodedQuery}&limit=1`;

  console.log('Testing Old Syntax (AND):', urlAnd);
  try {
    const res = await axios.get(urlAnd);
    console.log('Old Syntax Result:', res.data.results?.[0]?.openfda?.brand_name?.[0]);
  } catch (e) {
    console.log('Old Syntax Failed:', e.message);
  }

  console.log('\nTesting New Syntax (OR):', urlOr);
  try {
    const res = await axios.get(urlOr);
    console.log('New Syntax Result:', res.data.results?.[0]?.openfda?.brand_name?.[0]);
  } catch (e) {
    console.log('New Syntax Failed:', e.message);
  }
}

testOpenFDA();
