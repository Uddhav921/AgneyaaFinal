import { useState, useEffect } from 'react';
import './index.css';
import { useAuth } from './hooks/useAuth';
import { useSessionStore } from './hooks/useSessionStore';
import { signInWithGoogle } from './lib/supabase';

// ── Layout & Auth ──────────────────────────────────────
import Navbar from './components/Navbar';
import AuthCallback from './components/AuthCallback';
import AppLayout from './components/AppLayout';

// ── Public pages ───────────────────────────────────────────
import LandingPage from './components/LandingPage';

// ── Onboarding / Input ─────────────────────────────────
import OnboardForm from './components/OnboardForm';
import InputMethodSelect from './components/InputMethodSelect';
import VoiceRecorder from './components/VoiceRecorder';
import InputForm from './components/InputForm';

// ── App screens (inside AppLayout) ────────────────────
import Dashboard from './components/Dashboard';
import BeejChat from './components/BeejChat';
import MoolCalculator from './components/MoolCalculator';
import FinalReport from './components/FinalReport';
import Feedback from './components/Feedback';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/*
  ══════════════════════════════════════════════════════
  APP STATE MACHINE
  ══════════════════════════════════════════════════════
  'landing'      → Public Home (LandingPage + Navbar)
  'onboarding'   → OnboardForm: language + consent
  'inputMethod'  → InputMethodSelect: Text vs Voice
  'voiceInput'   → VoiceRecorder: record business idea
  'inputs'       → InputForm: full business details form
  ─── Inside AppLayout (left module sidebar) ──────────
  'dashboard'    → Dashboard: hub — access all 4 modules
  'chat'         → Module 1: Beej AI conversational analysis
  'mool'         → Module 2: Mool financial calculator
  'report'       → Module 3: Final feasibility report
  'feedback'     → Module 4: Feedback & rating
  ══════════════════════════════════════════════════════
*/

// States that render inside AppLayout (with left module sidebar)
const APP_LAYOUT_STATES = ['dashboard', 'chat', 'mool', 'report', 'feedback'];

export default function App() {
  const { user, session, loading } = useAuth();
  const store = useSessionStore();

  // ── Core state ────────────────────────────────────────────────────
  const [appState, setAppState] = useState('landing');
  const [checkingOnboard, setCheckingOnboard] = useState(false);
  const [businessContext, setBusinessContext] = useState({});
  const [voiceInitialData, setVoiceInitialData] = useState({});
  const [moolData, setMoolData] = useState(null);
  const [stateRestored, setStateRestored] = useState(false);
  const [fromVoice, setFromVoice] = useState(false); // track if user used voice input

  // ── Module completion tracking ──────────────────────────────────
  const [completedModules, setCompletedModules] = useState({ m1: false, m2: false, m3: false, m4: false });

  // ── /auth/callback route ──────────────────────────────
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  // ── Restore persisted state on mount ─────────────────
  useEffect(() => {
    try {
      const saved = store.getAppState();
      const savedMool = localStorage.getItem('agneyaa_mool_data');
      const savedCompleted = localStorage.getItem('agneyaa_completed_modules');

      if (savedMool) setMoolData(JSON.parse(savedMool));
      if (savedCompleted) setCompletedModules(JSON.parse(savedCompleted));

      if (saved?.businessContext && Object.keys(saved.businessContext).length > 0) {
        setBusinessContext(saved.businessContext);
      }
    } catch { }
    setStateRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist appState + businessContext on every change
  useEffect(() => {
    if (!stateRestored) return;
    store.saveAppState(appState, businessContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, businessContext, stateRestored]);

  // ── Persist completed modules ─────────────────────────
  useEffect(() => {
    if (!stateRestored) return;
    localStorage.setItem('agneyaa_completed_modules', JSON.stringify(completedModules));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedModules, stateRestored]);

  // ── Persist mool data ─────────────────────────────────
  useEffect(() => {
    if (!moolData) return;
    try { localStorage.setItem('agneyaa_mool_data', JSON.stringify(moolData)); } catch { }
  }, [moolData]);

  // ── Auth state change: check onboarding, restore session
  useEffect(() => {
    if (!user || !session) {
      if (appState !== 'landing') setAppState('landing');
      return;
    }

    // Has a persisted app-layout session?
    const saved = store.getAppState();
    const sid = store.getCurrentSessionId();
    const sess = sid ? store.getSession(sid) : null;

    if (APP_LAYOUT_STATES.includes(saved?.state)) {
      if (saved.businessContext && Object.keys(saved.businessContext).length > 0) {
        setBusinessContext(saved.businessContext);
        setAppState(saved.state);
        return;
      }
    }

    // Fresh login — check onboarding status
    const hasOnboarded = localStorage.getItem('agneyaa_onboarded');
    setCheckingOnboard(false);
    setAppState(hasOnboarded === 'true' ? 'inputMethod' : 'onboarding');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session]);

  // ── Mark module complete ──────────────────────────────
  const markDone = (mod) =>
    setCompletedModules(prev => ({ ...prev, [mod]: true }));

  // ── Navigation handler (from AppLayout sidebar or module buttons) ───
  // When the user navigates TO a module, the PREVIOUS module is auto-marked done.
  // This means: just visiting Mool marks Beej as done, etc.
  const handleNavigate = (stateKey) => {
    const prev = { chat: null, mool: 'm1', report: 'm2', feedback: 'm3' };
    const prevMod = prev[stateKey];
    if (prevMod) markDone(prevMod);
    setAppState(stateKey);
  };

  // ── Profile/avatar click in Navbar (public pages) ─────
  const handleProfileClick = () => {
    const saved = store.getAppState();
    if (user && saved?.businessContext && Object.keys(saved.businessContext).length > 0) {
      setBusinessContext(saved.businessContext);
      setAppState(APP_LAYOUT_STATES.includes(saved.state) ? saved.state : 'dashboard');
    }
  };

  // ────────────────────────────────────────────────────────
  // Handler functions
  // ────────────────────────────────────────────────────────

  // Step 1: Onboarding complete
  const handleOnboardComplete = async ({ language, consent }) => {
    // Save language for multilingual support
    localStorage.setItem('agneyaa_language', language);
    localStorage.setItem('agneyaa_onboarded', 'true');
    setAppState('inputMethod');
  };

  // Step 2a: Method select
  const handleMethodSelect = (method) => {
    if (method === 'text') {
      const saved = store.getFormData();
      setVoiceInitialData(saved || {});
      setAppState('inputs');
    } else {
      setAppState('voiceInput');
    }
  };

  // Step 2b: Voice transcript — pre-fill form AND flag as voice session
  const handleVoiceTranscript = (transcript) => {
    setFromVoice(true);
    setVoiceInitialData({ business_idea: transcript });
    setAppState('inputs');
  };

  // Step 2c: Form data saved on every field change
  const handleFormChange = (formData) => {
    store.saveFormData(formData);
  };

  // Step 2 → Dashboard: form submitted
  const handleInputSubmit = (formData) => {
    // Merge saved language into businessContext
    const lang = localStorage.getItem('agneyaa_language') || 'en';
    const ctx = { ...formData, language: lang };
    setBusinessContext(ctx);
    store.saveFormData(ctx);
    store.setCurrentSessionId(null); // fresh Beej session
    setAppState('dashboard');
  };

  // Edit inputs (from Dashboard)
  const handleEditInputs = () => {
    const saved = store.getFormData() || businessContext;
    setVoiceInitialData(saved);
    setAppState('inputs');
  };

  // Module 1 (Beej) → go to Module 2 (called from "Continue" button inside chat)
  const handleBeejDone = () => {
    markDone('m1');
    setAppState('mool');
  };

  // Module 2 (Mool) → store data + go to Module 3
  const handleMoolNext = (data) => {
    setMoolData(data);
    markDone('m2');
    setAppState('report');
  };

  // Module 3 (Report) → go to Module 4
  const handleReportNext = () => {
    markDone('m3');
    setAppState('feedback');
  };

  // Module 4 (Feedback) → mark done + go to dashboard
  const handleFeedbackSubmit = () => {
    markDone('m4');
    setAppState('dashboard');
  };

  // "New Analysis" — reset everything
  const handleNewSession = () => {
    store.setCurrentSessionId(null);
    store.clearFormData();
    setVoiceInitialData({});
    setBusinessContext({});
    setMoolData(null);
    setCompletedModules({ m1: false, m2: false, m3: false, m4: false });
    setAppState('inputMethod');
  };

  // ────────────────────────────────────────────────────────
  // Loading spinner
  // ────────────────────────────────────────────────────────
  if (loading || checkingOnboard) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-muted)',
        flexDirection: 'column', gap: '1rem',
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(111,187,124,0.2)',
          borderTopColor: 'var(--leaf)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '0.9rem' }}>Loading Agneyaa…</span>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // RENDER: Public pre-auth screens (no AppLayout)
  // ────────────────────────────────────────────────────────
  if (appState === 'landing') {
    return (
      <>
        <Navbar onProfileClick={user ? handleProfileClick : undefined} />
        <LandingPage
          isLoggedIn={!!user}
          onGetStarted={() => {
            if (user) {
              setAppState('inputMethod');
            } else {
              signInWithGoogle();
            }
          }}
          onDashboard={user ? handleProfileClick : undefined}
        />
      </>
    );
  }

  if (appState === 'onboarding') {
    return (
      <>
        <Navbar onProfileClick={handleProfileClick} />
        <OnboardForm
          user={user}
          onComplete={handleOnboardComplete}
          onBack={() => setAppState('landing')}
        />
      </>
    );
  }

  if (appState === 'inputMethod') {
    return (
      <>
        <Navbar onProfileClick={handleProfileClick} />
        <InputMethodSelect
          onSelect={handleMethodSelect}
          onBack={() => setAppState('onboarding')}
        />
      </>
    );
  }

  if (appState === 'voiceInput') {
    return (
      <>
        <Navbar onProfileClick={handleProfileClick} />
        <VoiceRecorder
          onTranscriptReady={handleVoiceTranscript}
          onBack={() => setAppState('inputMethod')}
        />
      </>
    );
  }

  if (appState === 'inputs') {
    return (
      <>
        <Navbar onProfileClick={handleProfileClick} />
        <InputForm
          onSubmit={handleInputSubmit}
          onFormChange={handleFormChange}
          loading={false}
          initialData={voiceInitialData}
          onBack={() => setAppState('inputMethod')}
        />
      </>
    );
  }

  // ────────────────────────────────────────────────────────
  // RENDER: App screens — all inside AppLayout with left sidebar
  // ────────────────────────────────────────────────────────
  if (APP_LAYOUT_STATES.includes(appState)) {
    return (
      <AppLayout
        appState={appState}
        user={user}
        completedModules={completedModules}
        onNavigate={handleNavigate}
        onHome={() => setAppState('landing')}
      >
        {/* Dashboard */}
        {appState === 'dashboard' && (
          <Dashboard
            businessContext={businessContext}
            user={user}
            completedModules={completedModules}
            onModule={handleNavigate}
            onEditInputs={handleEditInputs}
          />
        )}

        {/* Module 1 — Beej AI Chat */}
        {appState === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <BeejChat
                businessContext={businessContext}
                session={session}
                onBack={() => setAppState('dashboard')}
                onNewSession={handleNewSession}
                onProceedToMool={handleBeejDone}
                fromVoice={fromVoice}
              />
            </div>
            {/* "Continue to Module 2" action bar */}
            <div style={{
              flexShrink: 0,
              padding: '0.6rem 1.25rem',
              background: 'linear-gradient(90deg, rgba(10,26,14,0.98), rgba(10,26,14,0.95))',
              borderTop: '1px solid rgba(111,187,124,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                💡 When you're done discussing with Beej, proceed to the Financial Calculator
              </span>
              <button
                onClick={handleBeejDone}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.1rem',
                  background: 'linear-gradient(135deg, #81b4f5, #5a96e8)',
                  border: 'none', borderRadius: '9px', color: '#0a1420',
                  fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                💰 Continue to Module 2 &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Module 2 — Mool Financial Calculator */}
        {appState === 'mool' && (
          <MoolCalculator
            businessContext={businessContext}
            onNext={handleMoolNext}
            onBack={() => setAppState('chat')}
            onMoolData={setMoolData}
          />
        )}

        {/* Module 3 — Final Report */}
        {appState === 'report' && (
          <FinalReport
            businessContext={businessContext}
            moolData={moolData}
            onBack={() => setAppState('mool')}
            onNext={handleReportNext}
          />
        )}

        {/* Module 4 — Feedback */}
        {appState === 'feedback' && (
          <Feedback
            businessContext={businessContext}
            onSubmit={handleFeedbackSubmit}
            onBack={() => setAppState('report')}
            onGoHome={() => setAppState('dashboard')}
          />
        )}
      </AppLayout>
    );
  }

  // Fallback
  return (
    <>
      <Navbar onProfileClick={handleProfileClick} />
      <main><Hero /><Onboarding /></main>
    </>
  );
}
