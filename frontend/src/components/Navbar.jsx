import { useState, useEffect } from 'react';
import { supabase, signInWithGoogle, signOut } from '../lib/supabase';
import styles from './Navbar.module.css';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.5 36.1 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C41 36.2 44 30.6 44 24c0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
);

export default function Navbar({ onProfileClick }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = () => {
    setLoading(true);
    // signInWithGoogle is now synchronous — instantly sets window.location.href
    // so the loading flash is just visual feedback before navigation
    signInWithGoogle();
    // Reset loading after 5s in case redirect fails
    setTimeout(() => setLoading(false), 5000);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const avatarUrl  = user?.user_metadata?.avatar_url;
  const userName   = user?.user_metadata?.full_name || user?.email?.split('@')[0];

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <a href="/" className={styles.logo} aria-label="Agneyaa Home">
        <span className={styles.flame} aria-hidden="true">🔥</span>
        <span className={styles.brand}>Agneyaa</span>
      </a>

      {/* Auth area — top right */}
      {user ? (
        <div className={styles.userArea}>
          <div
            style={{ cursor: onProfileClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={onProfileClick}
            title={onProfileClick ? 'Go back to your active analysis' : ''}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {userName?.[0]?.toUpperCase()}
              </div>
            )}
            <span className={styles.userName}>{userName}</span>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut} aria-label="Sign out">
            Sign Out
          </button>
        </div>
      ) : (
        <button
          className={styles.signInBtn}
          id="btn-sign-in"
          onClick={handleSignIn}
          disabled={loading}
          aria-label="Sign in with Google"
        >
          <GoogleIcon />
          {loading ? 'Redirecting…' : 'Sign In'}
        </button>
      )}
    </nav>
  );
}
