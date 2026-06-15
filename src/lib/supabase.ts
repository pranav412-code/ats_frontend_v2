import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fail loud at startup instead of silent 401s/empty fetches when the build
// shipped without its required public config.
if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in the build environment.';
  if (import.meta.env.PROD) {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
