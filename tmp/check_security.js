const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple .env.local parser
function loadEnv() {
  const envPath = 'd:\\AntiGravity\\AI4S Smart HR\\.env.local';
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) process.env[parts[0].trim()] = parts[1].trim();
  });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Fetching security_config table...');
  const { data, error } = await supabase.from('security_config').select('*');
  if (error) { 
    console.error('SUPABASE ERROR:', error); 
    return; 
  }
  console.log('DATA COUNT:', data ? data.length : 0);
  console.log('SECURITY_CONFIG:', JSON.stringify(data, null, 2));
}

check();
