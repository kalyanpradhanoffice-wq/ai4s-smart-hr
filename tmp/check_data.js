const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- OKRS Sample ---');
  const { data: okrs } = await supabase.from('okrs').select('*').limit(1);
  console.log(JSON.stringify(okrs, null, 2));

  console.log('--- PAYROLL Count ---');
  const { count } = await supabase.from('payroll').select('*', { count: 'exact', head: true });
  console.log('Payroll count:', count);

  console.log('--- LEAVE_BALANCES Sample ---');
  const { data: lb } = await supabase.from('leave_balances').select('*').limit(1);
  console.log(JSON.stringify(lb, null, 2));
}

check();
