const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join('d:', 'AntiGravity', 'AI4S Smart HR', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase keys in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- OKRS Sample ---');
  const { data: okrs, error: okrErr } = await supabase.from('okrs').select('*').limit(1);
  if (okrErr) console.error('OKR Error:', okrErr.message);
  else console.log(JSON.stringify(okrs, null, 2));

  console.log('\n--- PAYROLL Count ---');
  const { count, error: payErr } = await supabase.from('payroll').select('*', { count: 'exact', head: true });
  if (payErr) console.error('Payroll Error:', payErr.message);
  else console.log('Payroll count:', count);

  console.log('\n--- LEAVE_BALANCES Sample ---');
  const { data: lb, error: lbErr } = await supabase.from('leave_balances').select('*').limit(1);
  if (lbErr) console.error('Leave Balances Error:', lbErr.message);
  else console.log(JSON.stringify(lb, null, 2));
}

check().catch(err => console.error(err));
