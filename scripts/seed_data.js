const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role for seeding

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables! Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Profiles (assuming some users already exist or creating dummy ones)
  // Note: For real migration, you'd use your existing auth users.
  // This is just a conceptual example for the new tables.

  const testUser = 'YOUR_TEST_USER_ID_HERE'; // Replace with a real UUID from auth.users

  // 2. Seed Leave Balances
  console.log('- Seeding leave balances...');
  await supabase.from('leave_balances').upsert([
    { user_id: testUser, cl: 5, el: 10, sl: 8, ml: 0, lwp: 2, year: 2025 }
  ]);

  // 3. Seed Sample Attendance
  console.log('- Seeding attendance logs...');
  await supabase.from('attendance').insert([
    { employee_id: testUser, date: '2025-02-18', status: 'present', clock_in: '09:00', clock_out: '18:00', work_hours: 9 },
    { employee_id: testUser, date: '2025-02-19', status: 'present', clock_in: '09:15', clock_out: '17:45', work_hours: 8.5 }
  ]);

  // 4. Seed sample OKRs
  console.log('- Seeding OKRs...');
  await supabase.from('okrs').insert([{
    user_id: testUser,
    objective: 'Standardize HR Operations',
    quarter: 'Q1 2025',
    overall_progress: 35,
    key_results: [
      { id: 'KR1', title: 'Migrate to Supabase', target: 100, current: 100, unit: '%' },
      { id: 'KR2', title: 'Automate Payroll', target: 100, current: 10, unit: '%' }
    ]
  }]);

  // 5. Seed Security Config
  console.log('- Initializing security configuration...');
  await supabase.from('security_config').upsert([{
    id: 'global_config',
    wifi_restriction_enabled: false,
    allowed_networks: ['Office-Main', 'Office-Guest'],
    allowed_ips: ['1.2.3.4/32'],
    exempt_roles: ['super_admin', 'core_admin'],
    popup_message: 'Restricted Access: Please connect to the office network.'
  }]);

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
