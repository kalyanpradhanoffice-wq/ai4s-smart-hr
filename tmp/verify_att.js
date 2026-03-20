const { createClient } = require('@supabase/supabase-client');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envData = {};
try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            envData[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
} catch (e) { }

const supabase = createClient(
    envData.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    envData.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data: users } = await supabase.from('profiles').select('id, email').eq('email', 'kalyanpradhanoffice@gmail.com');
    if (!users || users.length === 0) return 'User not found';
    
    const userId = users[0].id;
    const today = new Date().toISOString().split('T')[0];
    const { data: att } = await supabase.from('attendance').select('*').eq('user_id', userId).eq('date', today);
    
    return JSON.stringify(att, null, 2);
}

check().then(res => {
    fs.writeFileSync(path.join(__dirname, 'verify_result.json'), res);
    process.exit(0);
}).catch(e => {
    fs.writeFileSync(path.join(__dirname, 'verify_error.txt'), e.message);
    process.exit(1);
});
