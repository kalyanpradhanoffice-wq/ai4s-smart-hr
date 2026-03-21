const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
const supabaseKey = keyMatch ? keyMatch[1].trim() : null;

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Adding photo_captured column to attendance table...');
  
  // We use a raw SQL approach via a temporary function if possible, 
  // or we just try to update a non-existent column to see if it works (it won't).
  // Since we don't have a direct SQL tool, we'll suggest the user to run it in Supabase Dashboard
  // OR if they have an RPC for SQL, we use that.
  
  // Actually, I'll try to use a 'hidden' trick: if the table was created via Supabase, 
  // sometimes there is an 'exec_sql' RPC. Let's try it just in case.
  
  const sql = `ALTER TABLE attendance ADD COLUMN IF NOT EXISTS photo_captured BOOLEAN DEFAULT FALSE;`;
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Migration failed via RPC (expected if exec_sql is missing):', error.message);
    console.log('\nPLEASE RUN THIS SQL IN YOUR SUPABASE DASHBOARD:');
    console.log(sql);
  } else {
    console.log('Migration successful!');
  }
  process.exit(0);
}

migrate();
