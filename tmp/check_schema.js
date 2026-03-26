const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

supabase.from('attendance').select('location').limit(1).then(({ data, error }) => {
    if (error) {
        console.log('Error (likely missing column):', error.message);
    } else {
        console.log('Location column exists.');
    }
    process.exit();
});
