import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET all company holidays
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('company_holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, holidays: data || [] });
  } catch (error) {
    console.error('GET /api/settings/holidays error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create a new holiday
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, date, type } = body;

    if (!name || !date || !type) {
      return NextResponse.json({ error: 'name, date, and type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('company_holidays')
      .insert([{ name, date, type }])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, holiday: data?.[0] });
  } catch (error) {
    console.error('POST /api/settings/holidays error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — update existing holiday
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, date, type } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (date !== undefined) updates.date = date;
    if (type !== undefined) updates.type = type;

    const { error } = await supabase
      .from('company_holidays')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Holiday updated' });
  } catch (error) {
    console.error('PUT /api/settings/holidays error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove a holiday
export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase.from('company_holidays').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    console.error('DELETE /api/settings/holidays error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
