/**
 * useLanguage.js — React context for language-aware translation.
 *
 * Usage:
 *   const { lang, t } = useLanguage();
 *   <p>{t('form_title')}</p>
 *
 * The language is read from localStorage('agneyaa_language').
 * Updates reactively when the language changes via setLang().
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { t as translate } from '../lib/i18n';

const LanguageContext = createContext(null);

const SUPPORTED = ['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn'];

function getStoredLang() {
  try {
    const stored = localStorage.getItem('agneyaa_language');
    return SUPPORTED.includes(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

/**
 * LanguageProvider — wrap your root App with this.
 * It listens for the custom 'agneyaa-lang-change' event so any
 * component can trigger a re-render by dispatching that event.
 */
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang);

  // Allow external language changes (e.g. from OnboardForm)
  const setLang = useCallback((code) => {
    if (!SUPPORTED.includes(code)) return;
    localStorage.setItem('agneyaa_language', code);
    setLangState(code);
    // Broadcast so any component can react
    window.dispatchEvent(new CustomEvent('agneyaa-lang-change', { detail: code }));
  }, []);

  // Listen for language changes from any source
  useEffect(() => {
    const handler = (e) => {
      if (SUPPORTED.includes(e.detail)) setLangState(e.detail);
    };
    window.addEventListener('agneyaa-lang-change', handler);
    return () => window.removeEventListener('agneyaa-lang-change', handler);
  }, []);

  // Memoised translate function bound to current lang
  const tFn = useCallback((key) => translate(key, lang), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useLanguage() — consumes the language context.
 * Returns { lang, setLang, t }.
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Graceful fallback when used outside provider (shouldn't happen)
    const lang = getStoredLang();
    return {
      lang,
      setLang: () => {},
      t: (key) => translate(key, lang),
    };
  }
  return ctx;
}
