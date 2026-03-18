import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, designation, department, role, employee_id } = req.body;

  try {
    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authUser.user.id,
          employee_id,
          name,
          email,
          designation,
          department,
          role: role || 'employee',
          status: 'active'
        }
      ]);

    if (profileError) throw profileError;

    return res.status(200).json({ success: true, user: authUser.user });
  } catch (error) {
    console.error('Admin Create User Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
