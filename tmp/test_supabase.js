const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing connectivity...');
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.log('Supabase Error:', error.message);
    } else {
      console.log('Success! Profiles data:', data);
    }
  } catch (e) {
    console.log('Script error:', e.message);
  }
  process.exit();
}

test();
