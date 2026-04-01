import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET all leave types
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, leaveTypes: data || [] });
  } catch (error) {
    console.error('GET /api/settings/leave-types error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create a new leave type
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, yearly_quota, is_active } = body;

    if (!name || yearly_quota === undefined) {
      return NextResponse.json({ error: 'name and yearly_quota are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leave_types')
      .insert([{ name, yearly_quota: Number(yearly_quota), is_active: is_active !== false }])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, leaveType: data?.[0] });
  } catch (error) {
    console.error('POST /api/settings/leave-types error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — update existing leave type
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, yearly_quota, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (yearly_quota !== undefined) updates.yearly_quota = Number(yearly_quota);
    if (is_active !== undefined) updates.is_active = is_active;

    const { error } = await supabase
      .from('leave_types')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Leave type updated' });
  } catch (error) {
    console.error('PUT /api/settings/leave-types error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove a leave type
export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase.from('leave_types').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Leave type deleted' });
  } catch (error) {
    console.error('DELETE /api/settings/leave-types error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
