const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkColumns() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return;

  const supabase = createClient(url, key);

  const { data, error } = await supabase.from('support_conversations').select('*').limit(1);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('support_conversations columns:', Object.keys(data[0] || {}));
    if (data.length === 0) {
       console.log('No data in support_conversations, but table exists.');
    }
  }
}

checkColumns();
