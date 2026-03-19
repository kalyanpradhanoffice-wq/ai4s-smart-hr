import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Shared backend features will be disabled.');
}

// Create client or dummy to prevent crash if env vars are missing
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve(),
      },
      from: () => ({
        select: () => ({ 
          order: () => ({ 
            limit: () => ({ single: () => Promise.resolve({ data: null, error: 'Supabase not configured' }) }),
            single: () => Promise.resolve({ data: null, error: 'Supabase not configured' })
          }),
          eq: () => ({ 
            single: () => Promise.resolve({ data: null, error: 'Supabase not configured' }),
            order: () => Promise.resolve({ data: null, error: 'Supabase not configured' })
          }),
          single: () => Promise.resolve({ data: null, error: 'Supabase not configured' })
        }),
        insert: () => Promise.resolve({ data: null, error: 'Supabase not configured' }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: 'Supabase not configured' }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: 'Supabase not configured' }) }),
        upsert: () => Promise.resolve({ data: null, error: 'Supabase not configured' }),
      })
    };
