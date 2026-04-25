import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('recent_searches').select('*').limit(1);
  if (error) {
    console.error('Database Error:', error);
  } else {
    console.log('Success. Data:', data);
  }
}
check();
