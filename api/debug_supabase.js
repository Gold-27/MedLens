const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the api directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  console.log('Testing Supabase Connection...');
  console.log('URL:', url);
  console.log('Key:', key ? 'Present' : 'Missing');

  if (!url || !key) {
    console.error('ERROR: Supabase URL or Key missing in .env');
    return;
  }

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase.from('cabinet_items').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('ERROR reaching cabinet_items table:', error.message);
      if (error.message.includes('relation "cabinet_items" does not exist')) {
        console.log('SUGGESTION: You need to run the migration in Supabase SQL Editor.');
      }
    } else {
      console.log('SUCCESS: Successfully connected to Supabase and found cabinet_items table.');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

testSupabase();
