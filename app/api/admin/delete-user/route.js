import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Delete Related Records from ALL Modules (Cascading manually)
    // Most tables use user_id or employee_id. We'll delete from all.
    const tables = [
      { name: 'attendance', col: 'employee_id' },
      { name: 'leave_balances', col: 'user_id' },
      { name: 'leaves', col: 'employee_id' },
      { name: 'okrs', col: 'user_id' },
      { name: 'notifications', col: 'user_id' },
      { name: 'regularizations', col: 'employee_id' },
      { name: 'loans', col: 'employee_id' },
      { name: 'salary_upgrades', col: 'employee_id' },
      { name: 'interviews', col: 'interviewer_id' },
      { name: 'kudos', col: 'from_id' },
      { name: 'kudos', col: 'to_id' },
      { name: 'feedback', col: 'from_id' },
      { name: 'feedback', col: 'to_id' },
      { name: 'activity_history', col: 'performed_by_id' },
      { name: 'activity_history', col: 'target_employee_id' }
    ];

    for (const table of tables) {
      await supabaseAdmin.from(table.name).delete().eq(table.col, userId);
    }

    // 2. Delete from Profiles Table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // 3. Delete from Supabase Auth (Last)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError && authError.status !== 404) throw authError;

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
