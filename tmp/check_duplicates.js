
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

async function checkDuplicates() {
  console.log('Checking for duplicate attendance records...');
  const { data, error } = await supabase
    .from('attendance')
    .select('user_id, date, id, punch_in, punch_out, clock_in, clock_out');

  if (error) {
    console.error('Error fetching attendance:', error);
  } else {
    const counts = {};
    data.forEach(a => {
      const key = `${a.user_id}_${a.date}`;
      if (!counts[key]) counts[key] = [];
      counts[key].push(a);
    });

    let found = false;
    for (const key in counts) {
      if (counts[key].length > 1) {
        console.log(`Duplicate found for ${key}:`, counts[key]);
        found = true;
      }
    }
    if (!found) console.log('No duplicates found.');
  }
}

checkDuplicates();
