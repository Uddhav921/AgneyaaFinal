import { useState } from 'react';
import styles from './OnboardForm.module.css';
import PageNav from './PageNav';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'বাংলা' },
];

/**
 * OnboardForm — Step 1 post-login.
 * Collects: preferred language + data consent.
 */
export default function OnboardForm({ user, onComplete, onBack }) {
  const [language, setLanguage] = useState('en');
  const [consent,  setConsent]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) {
      setError('Please provide consent to continue.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Save profile to backend
      const token = (await import('../lib/supabase')).supabase.auth.getSession
        ? (await (await import('../lib/supabase')).supabase.auth.getSession()).data.session?.access_token
        : null;

      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ language, consent }),
      });

      onComplete({ language, consent });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  const handleForward = () => {
    if (consent) handleSubmit({ preventDefault: () => {} });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <PageNav
          onBack={onBack}
          onForward={handleForward}
          forwardLabel="Continue"
          forwardDisabled={!consent || loading}
        />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.wave}>👋</span>
          <h2>Welcome, {firstName}!</h2>
          <p>Let's set up your profile in 30 seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Step indicator */}
          <div className={styles.steps}>
            <div className={`${styles.step} ${styles.active}`}>
              <span>1</span> Profile
            </div>
            <div className={styles.stepLine} />
            <div className={styles.step}>
              <span>2</span> Your Business
            </div>
          </div>

          {/* Language selector */}
          <div className={styles.field}>
            <label className={styles.label}>🌐 Preferred Language</label>
            <div className={styles.langGrid}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`${styles.langBtn} ${language === lang.code ? styles.selected : ''}`}
                  onClick={() => setLanguage(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Consent */}
          <div className={styles.consentBox}>
            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className={styles.checkbox}
              />
              <span>
                I consent to Agneyaa using my location and business data to generate
                AI-powered feasibility reports. Data is used only to improve your results
                and is never sold.
              </span>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !consent}
          >
            {loading ? 'Saving…' : 'Continue →'}
          </button>

        </form>
      </div>
    </div>
  );
}
