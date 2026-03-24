const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fbypdyiponyvpsdmiqmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieXBkeWlwb255dnBzZG1pcW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzA0MjcsImV4cCI6MjA4OTQwNjQyN30.CdnmTX36aanAQqdnkLS3-RPcsBWHrMswNNm0a3UqJ1M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLeaves() {
  const { data, error } = await supabase.from('leaves').select('*').limit(5);
  console.log('Error:', error);
  console.log('Data:', data);
}

checkLeaves();
