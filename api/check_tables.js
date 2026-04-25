const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkTables() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using the one we just fixed

  if (!url || !key) {
    console.error('ERROR: Supabase URL or Service Role Key missing in .env');
    return;
  }

  const supabase = createClient(url, key);

  const tables = ['cabinet_items', 'support_conversations', 'support_messages'];

  for (const table of tables) {
    console.log(`Checking table: ${table}...`);
    const { error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Success: Table '${table}' exists.`);
    }
  }
}

checkTables();
