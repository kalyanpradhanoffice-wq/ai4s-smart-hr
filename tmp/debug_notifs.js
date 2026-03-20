
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotifications() {
    console.log('Fetching notifications...');
    const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, read, created_at')
        .eq('read', false);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log('Unread Notifications Count:', data.length);
    if (data.length > 0) {
        data.forEach(n => {
            console.log(`ID: ${n.id}, UserID: ${n.user_id}, Title: ${n.title}, CreatedAt: ${n.created_at}`);
        });
    } else {
        console.log('No unread notifications found in the entire table.');
    }
}

checkNotifications();
