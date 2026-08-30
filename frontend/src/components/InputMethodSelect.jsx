import styles from './InputMethodSelect.module.css';
import PageNav from './PageNav';
import { useLanguage } from '../hooks/useLanguage.jsx';

/**
 * InputMethodSelect - Step 2a
 * User picks how they want to fill out their business info:
 *   1) Type it out (text)
 *   2) Speak it (voice -> speech-to-text)
 *
 * onBack  - go back to onboarding (language/consent step)
 * onSelect - called with 'text' or 'voice'
 */
export default function InputMethodSelect({ onSelect, onBack }) {
  const { t } = useLanguage();

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>

        {/* Back / Forward nav */}
        <PageNav onBack={onBack} />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.icon}>💬</span>
          <h2>{t('input_method_heading')}</h2>
          <p>{t('input_method_subtitle')}</p>
        </div>

        {/* Options */}
        <div className={styles.options}>

          {/* Text Input */}
          <button
            id="btn-input-text"
            className={styles.optionCard}
            onClick={() => onSelect('text')}
          >
            <span className={styles.optionIcon}>⌨️</span>
            <div className={styles.optionBody}>
              <span className={styles.optionTitle}>{t('input_method_type_title')}</span>
              <span className={styles.optionDesc}>
                {t('input_method_type_desc')}
              </span>
            </div>
            <span className={styles.arrow}>→</span>
          </button>

          {/* Voice Input */}
          <button
            id="btn-input-voice"
            className={`${styles.optionCard} ${styles.voiceCard}`}
            onClick={() => onSelect('voice')}
          >
            <span className={styles.optionIcon}>🎙️</span>
            <div className={styles.optionBody}>
              <span className={styles.optionTitle}>{t('input_method_voice_title')}</span>
              <span className={styles.optionDesc}>
                {t('input_method_voice_desc')}
              </span>
            </div>
            <span className={styles.badge}>NEW</span>
          </button>

        </div>

        <p className={styles.hint}>{t('input_method_privacy')}</p>
      </div>
    </div>
  );
}
