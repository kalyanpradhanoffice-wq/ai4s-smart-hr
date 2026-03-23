const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  let log = 'Checking Supabase Schema...\n';

  const tables = ['profiles', 'leaves', 'attendance', 'okrs', 'payroll', 'activity_history', 'leave_balances', 'regularizations', 'feedback', 'loans', 'salary_upgrades', 'notifications', 'kudos', 'interviews'];
  
  for (const table of tables) {
    log += `\n--- Table: ${table} ---\n`;
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        log += `Error fetching ${table}: ${error.message}\n`;
      } else if (data && data.length > 0) {
        log += `Columns: ${Object.keys(data[0]).join(', ')}\n`;
        log += `Sample Row: ${JSON.stringify(data[0])}\n`;
      } else {
        log += 'Table found but it is empty.\n';
      }
    } catch (e) {
      log += `Exception for ${table}: ${e.message}\n`;
    }
  }

  fs.writeFileSync('d:\\AntiGravity\\AI4S Smart HR\\tmp\\schema_output.txt', log);
  console.log('Schema check complete. Output written to tmp/schema_output.txt');
}

checkSchema();
