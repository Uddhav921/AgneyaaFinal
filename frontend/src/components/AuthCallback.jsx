import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './AuthCallback.module.css';

/**
 * AuthCallback — handles the redirect after Google Sign-In via Supabase.
 * Supabase automatically processes the URL hash/params on this page.
 */
export default function AuthCallback() {
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) {
          setStatus('success');
          // Redirect to home after 1.5s
          setTimeout(() => { window.location.href = '/'; }, 1500);
        } else {
          setStatus('error');
        }
      } catch {
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
      {status === 'success' && (
        <div className={styles.card}>
          <span className={styles.successIcon}>✅</span>
          <p>Signed in! Redirecting…</p>
        </div>
      )}
      {status === 'error' && (
        <div className={styles.card}>
          <span className={styles.errorIcon}>❌</span>
          <p>Sign-in failed. <a href="/">Go back</a></p>
        </div>
      )}
    </div>
  );
}
