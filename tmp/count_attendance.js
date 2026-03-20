
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function countRows() {
  console.log('Counting attendance rows...');
  const { count, error } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting:', error);
  } else {
    console.log('Total rows in "attendance":', count);
    
    // Fetch all and log
    const { data } = await supabase.from('attendance').select('*').limit(10);
    console.log('Sample data:', JSON.stringify(data, null, 2));
  }
}

countRows();
