import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './AuthCallback.module.css';

/**
 * AuthCallback - handles the redirect after Google Sign-In via Supabase.
 *
 * Supabase redirects here with the session tokens in the URL hash:
 *   http://localhost:5173/auth/callback#access_token=...&refresh_token=...
 *
 * We manually set the session from the URL hash to handle device clock skew,
 * then redirect home.
 */
export default function AuthCallback() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handle = async () => {
      try {
        // Handle error query params from OAuth provider
        const searchParams = new URLSearchParams(window.location.search);
        const error = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');
        if (error) throw new Error(errorDesc || error);

        // Parse the URL hash that Supabase appends after OAuth
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken) {
          // Fallback: try getSession in case Supabase already processed it
          const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) throw new Error(sessionErr.message);
          if (!session) throw new Error('Sign-in failed. Please try again.');
          setStatus('success');
          setTimeout(() => { window.location.href = '/'; }, 900);
          return;
        }

        // Manually set the session so clock skew does not cause getSession() to return null
        const { error: setErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        if (setErr) throw new Error(setErr.message);

        setStatus('success');
        setTimeout(() => { window.location.href = '/'; }, 900);
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
          <p>Verifying your account...</p>
        </div>
      )}
      {status === 'success' && (
        <div className={styles.card}>
          <span className={styles.successIcon}>&#9989;</span>
          <p>Signed in! Redirecting...</p>
        </div>
      )}
      {status === 'error' && (
        <div className={styles.card}>
          <span className={styles.errorIcon}>&#10060;</span>
          <p>Sign-in failed. {message && <small>({message})</small>}</p>
          <a href="/" className={styles.link}>Go back</a>
        </div>
      )}
    </div>
  );
}