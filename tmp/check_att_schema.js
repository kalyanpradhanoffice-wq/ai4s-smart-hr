const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read from .env.local manually since we might not have dotenv in current execution context easily
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
const supabaseKey = keyMatch ? keyMatch[1].trim() : null;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('attendance').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in attendance:', Object.keys(data[0]));
  } else {
    console.log('No data in attendance table to check columns.');
  }
  process.exit(0);
}

check();
