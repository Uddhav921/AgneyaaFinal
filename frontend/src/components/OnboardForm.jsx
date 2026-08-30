import { useState } from 'react';
import styles from './OnboardForm.module.css';
import PageNav from './PageNav';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { supabase } from '../lib/supabase';

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
  const { lang, setLang, t } = useLanguage();
  const [language, setLanguage] = useState(lang || 'en');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLangSelect = (code) => {
    setLanguage(code);
    setLang(code); // platform-wide switch immediately
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) {
      setError(t('onboard_consent_required'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || null;

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
      setError(t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  const handleForward = () => {
    if (consent) handleSubmit({ preventDefault: () => { } });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <PageNav
          onBack={onBack}
          onForward={handleForward}
          forwardLabel={t('continue')}
          forwardDisabled={!consent || loading}
        />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.wave}>👋</span>
          <h2>{t('onboard_welcome')}, {firstName}!</h2>
          <p>{t('onboard_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Step indicator */}
          <div className={styles.steps}>
            <div className={`${styles.step} ${styles.active}`}>
              <span>1</span> {t('onboard_step_profile')}
            </div>
            <div className={styles.stepLine} />
            <div className={styles.step}>
              <span>2</span> {t('onboard_step_business')}
            </div>
          </div>

          {/* Language selector */}
          <div className={styles.field}>
            <label className={styles.label}>{t('onboard_language_label')}</label>
            <div className={styles.langGrid}>
              {LANGUAGES.map((lg) => (
                <button
                  key={lg.code}
                  type="button"
                  className={`${styles.langBtn} ${language === lg.code ? styles.selected : ''}`}
                  onClick={() => handleLangSelect(lg.code)}
                >
                  {lg.label}
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
              <span>{t('onboard_consent')}</span>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !consent}
          >
            {loading ? t('saving') : t('continue')}
          </button>

        </form>
      </div>
    </div>
  );
}
