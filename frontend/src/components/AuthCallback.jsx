import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './AuthCallback.module.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * AuthCallback — handles the redirect after Google Sign-In via Supabase.
 * 1. Gets the session from Supabase (auto-parsed from URL hash)
 * 2. Calls /auth/upsert-user to save email + name to MySQL users table
 * 3. Redirects to home page
 */
export default function AuthCallback() {
  const [status,  setStatus]  = useState('verifying'); // verifying | saving | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Step 1: Get session (Supabase auto-processes the URL hash)
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw new Error(error.message);
        if (!session) throw new Error('No session found after login.');

        // Step 2: Upsert user into MySQL users table
        setStatus('saving');
        const res = await fetch(`${API}/auth/upsert-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn('User upsert failed:', err.detail || res.status);
          // Don't block — still proceed to app
        }

        // Step 3: Redirect to home
        setStatus('success');
        setTimeout(() => { window.location.href = '/'; }, 1200);

      } catch (err) {
        console.error('Auth callback error:', err.message);
        setMessage(err.message);
        setStatus('error');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className={styles.wrap}>
      {status === 'verifying' && (
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p>Verifying your account…</p>
        </div>
      )}
      {status === 'saving' && (
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p>Setting up your profile…</p>
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
