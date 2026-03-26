const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkTable() {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
        const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
        const supabase = createClient(url, key);

        console.log('Checking security_config table status...');

        // 1. Check if the table exists
        const { data: tableCheck, error: tableError } = await supabase
            .from('security_config')
            .select('*')
            .limit(1);

        if (tableError) {
            console.error('TABLE ERROR (might not exist):', tableError.message);
            if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
                console.log('\n--- SQL TO CREATE TABLE ---');
                console.log(`
CREATE TABLE IF NOT EXISTS public.security_config (
    id TEXT PRIMARY KEY DEFAULT 'system_config',
    config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure RLS is handled or disabled for admin access
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to admins" ON public.security_config
FOR ALL TO authenticated USING (true) WITH CHECK (true);
                `);
            }
        } else {
            console.log('TABLE EXISTS: YES');
            console.log('CURRENT DATA:', JSON.stringify(tableCheck, null, 2));

            // 2. If it exists but is empty, initialize it
            if (tableCheck.length === 0) {
                console.log('TABLE IS EMPTY. Initializing...');
                const defaultConfig = {
                    wifiRestrictionEnabled: false,
                    allowedIPs: [],
                    allowedNetworks: [],
                    allowedAccessPoints: [],
                    restrictedRoles: [],
                    exemptRoles: ['super_admin', 'core_admin'],
                    popupMessage: 'Login Restricted: Please connect to the authorized company network to access AI4S Smart HR.'
                };
                const { error: insertError } = await supabase
                    .from('security_config')
                    .insert({ id: 'system_config', config: defaultConfig });
                
                if (insertError) console.error('INITIALIZATION ERROR:', insertError.message);
                else console.log('INITIALIZATION SUCCESSFUL.');
            }
        }
    } catch (err) {
        console.error('SCRIPT ERROR:', err.message);
    }
}

checkTable();
