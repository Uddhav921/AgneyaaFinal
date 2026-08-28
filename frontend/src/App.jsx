import { useState, useEffect } from 'react';
import './index.css';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';

import Navbar       from './components/Navbar';
import Hero         from './components/Hero';
import Onboarding   from './components/Onboarding';
import AuthCallback from './components/AuthCallback';
import OnboardForm  from './components/OnboardForm';
import InputForm    from './components/InputForm';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/*
  App state machine:
  'landing'    → public home (not logged in)
  'onboarding' → Step 1: language + consent  (logged in, first time)
  'inputs'     → Step 2: location + business (logged in, onboarded)
  'callback'   → /auth/callback route
*/

export default function App() {
  const { user, session, loading } = useAuth();
  const [appState,     setAppState]     = useState('landing');
  const [checkingOnboard, setCheckingOnboard] = useState(false);
  const [submitLoading,   setSubmitLoading]   = useState(false);

  // Handle /auth/callback route
  const isCallback = window.location.pathname === '/auth/callback';
  if (isCallback) return <AuthCallback />;

  // Once user logs in, check if they've completed onboarding
  useEffect(() => {
    if (!user || !session) {
      setAppState('landing');
      return;
    }

    const checkOnboard = async () => {
      setCheckingOnboard(true);
      try {
        const res = await fetch(`${API}/auth/onboard-status`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        setAppState(data.onboarded ? 'inputs' : 'onboarding');
      } catch {
        setAppState('onboarding'); // default to onboarding on error
      } finally {
        setCheckingOnboard(false);
      }
    };

    checkOnboard();
  }, [user, session]);

  // Step 1 complete → save profile → move to inputs
  const handleOnboardComplete = async ({ language, consent }) => {
    try {
      await fetch(`${API}/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ language, consent }),
      });
    } catch { /* handled in OnboardForm */ }
    setAppState('inputs');
  };

  // Step 2 complete → trigger Beej analysis (next phase)
  const handleInputSubmit = async (formData) => {
    setSubmitLoading(true);
    try {
      // TODO: Create business entry then run Beej analysis
      console.log('Business inputs submitted:', formData);
      alert('✅ Inputs received! AI analysis pipeline coming next.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Loading state while checking session / onboard status
  if (loading || checkingOnboard) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-muted)',
        flexDirection: 'column', gap: '1rem',
      }}>
        <div style={{
          width: 36, height: 36, border: '3px solid rgba(111,187,124,0.2)',
          borderTopColor: 'var(--leaf)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '0.9rem' }}>Loading…</span>
      </div>
    );
  }

  // ── Render by state ──────────────────────────────────────────
  if (appState === 'onboarding') {
    return (
      <>
        <Navbar />
        <OnboardForm user={user} onComplete={handleOnboardComplete} />
      </>
    );
  }

  if (appState === 'inputs') {
    return (
      <>
        <Navbar />
        <InputForm onSubmit={handleInputSubmit} loading={submitLoading} />
      </>
    );
  }

  // Default: landing page
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Onboarding />
      </main>
    </>
  );
}
