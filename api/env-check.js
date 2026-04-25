require('dotenv').config();
const path = require('path');
// Emulate index.ts loading
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('--- ENV CHECK ---');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'FOUND' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING');
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'FOUND' : 'MISSING');
console.log('Keys present:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
