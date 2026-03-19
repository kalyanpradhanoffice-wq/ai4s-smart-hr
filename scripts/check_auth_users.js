const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('🔍 Checking for existing Auth users...');
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  if (users.length === 0) {
    console.log('✅ No users found in Auth.');
  } else {
    console.log(`📋 Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- Email: ${u.email} | ID: ${u.id} | Created: ${u.created_at}`);
    });
    console.log('\n💡 TIP: If you see the user here but NOT in the "profiles" table, delete them from the Supabase Dashboard (Authentication > Users) and try creating them again in your app.');
  }
}

checkUsers();
