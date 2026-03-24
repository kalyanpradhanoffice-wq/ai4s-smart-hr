const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fbypdyiponyvpsdmiqmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieXBkeWlwb255dnBzZG1pcW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzA0MjcsImV4cCI6MjA4OTQwNjQyN30.CdnmTX36aanAQqdnkLS3-RPcsBWHrMswNNm0a3UqJ1M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnostic() {
  const { data: profiles } = await supabase.from('profiles').select('id, employee_id, name').limit(3);
  const { data: leaves } = await supabase.from('leaves').select('id, employee_id, status').limit(3);
  const { data: attendance } = await supabase.from('attendance').select('user_id, date, status').limit(3);
  
  console.log('--- PROFILES ---');
  console.log(profiles);
  console.log('\n--- LEAVES ---');
  console.log(leaves);
  console.log('\n--- ATTENDANCE ---');
  console.log(attendance);
}

diagnostic();
