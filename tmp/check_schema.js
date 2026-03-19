const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking Supabase Schema...');

  const tables = ['profiles', 'leaves', 'attendance', 'okrs', 'payroll', 'activity_history'];
  
  for (const table of tables) {
    console.log(`\n--- Table: ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).join(', '));
    } else {
      console.log('Table found but it is empty.');
    }
  }

  // Check for other potential tables
  const others = ['roles', 'leave_balances', 'regularizations', 'feedback', 'loans', 'salary_upgrades', 'notifications', 'kudos', 'interviews'];
  console.log('\n--- Checking for other tables ---');
  for (const table of others) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`${table}: Not found or error: ${error.message}`);
    } else {
      console.log(`${table}: Found!`);
    }
  }
}

checkSchema();
