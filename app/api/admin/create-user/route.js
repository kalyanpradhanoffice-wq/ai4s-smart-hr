import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      email, password, name, designation, department, role, employee_id,
      joinDate, type, phone, location, dob, gender, pan, managerId, functionalManagerId,
      salary, avatarColor
    } = body;

    // Handle nested or flat salary data from frontend
    const salary_basic = Number(body.salaryBasic || salary?.basic || 0);
    const salary_hra = Number(body.salaryHra || salary?.hra || 0);

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // 2. Create Profile with ALL 15+ Fields
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authUser.user.id,
          employee_id: employee_id,
          name,
          email,
          designation,
          department,
          role: role || 'employee',
          type: type || 'Confirm',
          status: 'active',
          join_date: joinDate || null,
          phone,
          location,
          dob: dob || null,
          gender,
          pan,
          manager_id: managerId || null,
          functional_manager_id: functionalManagerId || null,
          salary_basic,
          salary_hra,
          avatar_color: avatarColor,
          is_onboarded: true
        }
      ]);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, user: { ...authUser.user, employee_id } });
  } catch (error) {
    console.error('Admin Create User Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
