import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured =
  !!supabaseUrl &&
  !!supabaseKey &&
  !supabaseUrl.includes('your_supabase') &&
  !supabaseKey.includes('your_supabase');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

/**
 * Instantly redirect to Google OAuth via Supabase.
 * Uses direct URL — zero network call, no delay.
 *
 * ⚠️  SUPABASE DASHBOARD REQUIRED:
 *   Authentication → URL Configuration:
 *     Site URL      → http://localhost:5173          ← change from 3000!
 *     Redirect URLs → http://localhost:5173/auth/callback
 *
 *   Authentication → Providers → Google:
 *     Google Console Authorized redirect URI must include:
 *     https://<your-project>.supabase.co/auth/v1/callback
 */
export function signInWithGoogle() {
  if (!isConfigured) {
    alert('⚠️ Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env');
    return;
  }
  const callback = encodeURIComponent(`${window.location.origin}/auth/callback`);
  // Direct URL — browser navigates immediately, no async, no delay
  window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${callback}`;
}

/** Sign out the current user */
export async function signOut() {
  await supabase.auth.signOut();
}

/** Get current session or null */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}