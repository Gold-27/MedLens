const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listAllTables() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('ERROR: Supabase URL or Service Role Key missing');
    return;
  }

  const supabase = createClient(url, key);

  // This might fail depending on permissions, but service role usually can do it
  const { data, error } = await supabase.rpc('get_tables_list'); // Custom RPC? Unlikely.
  
  if (error) {
    // Try raw query if supported (unlikely via supabase-js without RPC)
    console.log('Trying direct query to information_schema...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables') // Usually not exposed via PostgREST
      .select('tablename')
      .eq('schemaname', 'public');
      
    if (tablesError) {
      console.error('Failed to list tables:', tablesError.message);
    } else {
      console.log('Tables in public schema:', tables);
    }
  } else {
    console.log('Tables:', data);
  }
}

listAllTables();
