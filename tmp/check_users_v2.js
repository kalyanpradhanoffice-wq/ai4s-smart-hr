const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from('profiles').select('id, email, name, role');
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(data));
}

checkUsers();
