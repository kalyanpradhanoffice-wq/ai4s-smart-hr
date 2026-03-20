
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking "attendance" table...');
  // Try to insert a dummy record with only basic fields to see if it works and what columns exist
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Fetched sample:', data);
  }

  // Try to insert WITHOUT location to see if it works
  console.log('Testing insert WITHOUT location...');
  const { error: insError } = await supabase
    .from('attendance')
    .insert([{ user_id: '00000000-0000-0000-0000-000000000000', date: '1970-01-01', status: 'present' }])
    .select();
  
  if (insError) {
    console.error('Insert WITHOUT location failed:', insError.message);
  } else {
    console.log('Insert WITHOUT location succeeded!');
  }

  // Try to insert WITH location
  console.log('Testing insert WITH location...');
  const { error: insError2 } = await supabase
    .from('attendance')
    .insert([{ user_id: '00000000-0000-0000-0000-000000000001', date: '1970-01-01', status: 'present', location: 'test' }])
    .select();

  if (insError2) {
    console.error('Insert WITH location failed:', insError2.message);
  } else {
    console.log('Insert WITH location succeeded!');
  }
}

checkSchema();
