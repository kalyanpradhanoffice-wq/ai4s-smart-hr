import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // 1. Delete from Supabase Auth (This is the most critical step)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    // Note: If user doesn't exist in Auth, we might still want to delete the profile
    if (authError && authError.status !== 404) throw authError;

    // 2. Delete from Profiles Table (Cascade should handle related data if FK is set, 
    // but we'll do it explicitly here for the profile)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
