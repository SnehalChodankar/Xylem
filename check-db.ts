import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('category_rules').select('*').limit(1);
  if (error) {
    if (error.code === '42P01') {
      console.log('TABLE_MISSING');
    } else {
      console.log('ERROR', error.message);
    }
  } else {
    console.log('TABLE_EXISTS', data);
  }
}

check();
