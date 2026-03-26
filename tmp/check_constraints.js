const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkConstraints() {
    const { data, error } = await supabase.rpc('get_constraints', { t_name: 'attendance' });
    if (error) {
        // Fallback: try to insert a duplicate and see if it fails
        console.log('RPC get_constraints not found, trying manual check...');
        const testPayload = { user_id: 1, date: '2020-01-01', status: 'test' };
        await supabase.from('attendance').insert([testPayload]);
        const { error: error2 } = await supabase.from('attendance').insert([testPayload]);
        console.log('Duplicate insert error:', error2 ? error2.message : 'No error (No unique constraint)');
        // Cleanup
        await supabase.from('attendance').delete().eq('status', 'test');
    } else {
        console.log('Constraints:', data);
    }
}

checkConstraints();
