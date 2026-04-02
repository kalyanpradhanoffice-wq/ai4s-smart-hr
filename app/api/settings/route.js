import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET all system settings
export async function GET(req) {
  const { authorized, error: authError } = await verifySuperAdmin(req);
  if (!authorized) return NextResponse.json({ error: authError }, { status: 403 });

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('setting_key', { ascending: true });

    if (error) throw error;

    // Transform key-value rows into a flat object for easy frontend consumption
    const settings = {};
    (data || []).forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — upsert one or more settings
export async function POST(req) {
  const { authorized, error: authError } = await verifySuperAdmin(req);
  if (!authorized) return NextResponse.json({ error: authError }, { status: 403 });

  try {
    const { settings } = await req.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid payload. Expected { settings: { key: value, ... } }' }, { status: 400 });
    }

    const rows = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('system_settings')
      .upsert(rows, { onConflict: 'setting_key' });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
