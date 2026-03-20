
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Adding UNIQUE constraint to leave_balances(user_id)...');
  const { error } = await supabase.rpc('execute_sql', {
    sql_query: 'ALTER TABLE public.leave_balances ADD CONSTRAINT unique_user_leave_balance UNIQUE (user_id);'
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Constraint already exists.');
    } else {
      console.error('Migration failed:', error);
      // Fallback: If RPC not enabled, we'll just have to handle it in JS
      console.log('Ensure you have "execute_sql" RPC or run the SQL manually in Supabase dashboard.');
    }
  } else {
    console.log('Successfully added UNIQUE constraint.');
  }
}

migrate();
