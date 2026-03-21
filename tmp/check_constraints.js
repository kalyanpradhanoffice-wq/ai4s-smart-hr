const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fbypdyiponyvpsdmiqmm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
  const tables = [
    'attendance', 'leave_balances', 'leaves', 'okrs', 'kudos', 
    'feedback', 'notifications', 'regularizations', 'loans', 
    'salary_upgrades', 'interviews', 'activity_history'
  ];

  console.log('Checking for related records...');
  
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, name').limit(1);
  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found to test with.');
    return;
  }
  
  const testId = profiles[0].id;
  console.log(`Testing with user: ${profiles[0].name} (${testId})`);

  for (const table of tables) {
    const columns = ['user_id', 'employee_id', 'from_id', 'to_id', 'performed_by_id', 'target_employee_id', 'interviewer_id'];
    
    for (const col of columns) {
      try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(col, testId);
        if (!error && count > 0) {
          console.log(`[FOUND] Table '${table}' has ${count} records linked via '${col}'`);
        }
      } catch (e) {
        // column might not exist in this table, skip
      }
    }
  }
  console.log('Done.');
}

checkConstraints().catch(console.error);
