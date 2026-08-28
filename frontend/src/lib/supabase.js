import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured =
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your_supabase') &&
  !supabaseKey.includes('your_supabase');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

/**
 * Trigger Google OAuth via Supabase.
 * Returns { success: true } on redirect initiation, or { error: string } on failure.
 */
export async function signInWithGoogle() {
  if (!isConfigured) {
    return { error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env' };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase returns a URL manually (non-browser flow), redirect manually
  if (data?.url) {
    window.location.href = data.url;
    return { success: true };
  }

  return { success: true };
}

/** Sign out the current user */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Sign out error:', error.message);
}

/** Returns the current session or null */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
