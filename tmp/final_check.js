const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
        const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
        const supabase = createClient(url, key);

        console.log('--- START DIAGNOSTIC ---');

        // Try to select
        const { data, error } = await supabase.from('security_config').select('*');

        if (error) {
            console.log('RESULT: ERROR');
            console.log('CODE:', error.code);
            console.log('MESSAGE:', error.message);
            
            if (error.message.includes('relation "public.security_config" does not exist')) {
                console.log('STATUS: TABLE_MISSING');
            }
        } else {
            console.log('RESULT: SUCCESS');
            console.log('ROWS_FOUND:', data.length);
            console.log('DATA:', JSON.stringify(data));
            
            if (data.length === 0) {
                console.log('STATUS: TABLE_EMPTY');
                // Try to initialize
                const defaultConfig = {
                    wifiRestrictionEnabled: false,
                    allowedIPs: [],
                    allowedNetworks: [],
                    allowedAccessPoints: [],
                    restrictedRoles: [],
                    exemptRoles: ['super_admin', 'core_admin'],
                    popupMessage: 'Login Restricted: Please connect to the authorized company network to access AI4S Smart HR.'
                };
                console.log('Attempting initialization...');
                const { error: insErr } = await supabase.from('security_config').insert({ id: 'system_config', config: defaultConfig });
                if (insErr) console.log('INIT_ERROR:', insErr.message);
                else console.log('INIT_SUCCESS');
            } else {
                console.log('STATUS: TABLE_READY');
            }
        }
        console.log('--- END DIAGNOSTIC ---');
    } catch (e) {
        console.log('SYSTEM_ERROR:', e.message);
    }
}

run();
