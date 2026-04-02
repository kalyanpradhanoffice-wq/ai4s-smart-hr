import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verifies if the request is from an authorized Super Admin.
 * Returns { authorized: true, user } or { authorized: false, error }.
 */
export async function verifySuperAdmin(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'Unauthenticated: No token provided' };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return { authorized: false, error: 'Unauthenticated: Invalid or expired token' };
    }

    // Fetch profile to verify role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { authorized: false, error: 'Forbidden: Profile not found' };
    }

    if (profile.role !== 'super_admin') {
      return { authorized: false, error: 'Forbidden: Super Admin access required' };
    }

    return { authorized: true, user: { ...user, role: profile.role } };
  } catch (error) {
    console.error('Authorization check failed:', error);
    return { authorized: false, error: 'Internal Server Error' };
  }
}
