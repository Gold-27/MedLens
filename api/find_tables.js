const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listTables() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('ERROR: Supabase URL or Service Role Key missing in .env');
    return;
  }

  const supabase = createClient(url, key);

  // We can query information_schema if we have service role key and permission
  // but usually we can just try to guess or use the API
  
  // Try querying a list of tables via RPC if available, or just common names
  const testNames = ['support_messages', 'support_message', 'messages', 'chat_messages'];
  
  for (const name of testNames) {
    const { error } = await supabase.from(name).select('*').limit(1);
    if (!error || !error.message.includes('schema cache')) {
       console.log(`Table found: ${name}`);
    } else {
       console.log(`Table NOT found: ${name} (${error.message})`);
    }
  }
}

listTables();
