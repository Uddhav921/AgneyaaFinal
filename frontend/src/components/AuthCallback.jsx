import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './AuthCallback.module.css';

/**
 * AuthCallback — handles the redirect after Google Sign-In via Supabase.
 *
 * Supabase redirects here as:
 *   http://localhost:5173/auth/callback#access_token=...&refresh_token=...
 *
 * Steps:
 *  1. Let Supabase SDK auto-process the URL hash and establish the session
 *  2. Confirm the session exists
 *  3. Redirect to home
 */
export default function AuthCallback() {
  const [status,  setStatus]  = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handle = async () => {
      try {
        // Also handle error redirects (?error=...)
        const searchParams = new URLSearchParams(window.location.search);
        const error = searchParams.get('error');
        if (error) throw new Error(`Google OAuth error: ${error}`);

        // Supabase SDK automatically reads the #access_token from the URL hash
        // and sets the session in its internal store. We just need to fetch it.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw new Error(sessionError.message);
        if (!session) throw new Error('No session received from Supabase.');

        // Success — redirect home
        setStatus('success');
        setTimeout(() => { window.location.href = '/'; }, 1000);

      } catch (err) {
        console.error('AuthCallback error:', err.message);
        setMessage(err.message);
        setStatus('error');
      }
    };

    handle();
  }, []);

  return (
    <div className={styles.wrap}>
      {status === 'verifying' && (
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p>Verifying your account…</p>
        </div>
      )}
      {status === 'success' && (
        <div className={styles.card}>
          <span className={styles.successIcon}>✅</span>
          <p>Signed in successfully! Redirecting…</p>
        </div>
      )}
      {status === 'error' && (
        <div className={styles.card}>
          <span className={styles.errorIcon}>❌</span>
          <p>Sign-in failed. {message && <small>({message})</small>}</p>
          <a href="/" className={styles.link}>← Go back</a>
        </div>
      )}
    </div>
  );
}
