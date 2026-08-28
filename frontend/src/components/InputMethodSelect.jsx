import styles from './InputMethodSelect.module.css';
import PageNav from './PageNav';

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
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>

        {/* Back / Forward nav */}
        <PageNav onBack={onBack} />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.icon}>💬</span>
          <h2>How would you like to share your business details?</h2>
          <p>Choose the method that feels most comfortable for you.</p>
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
              <span className={styles.optionTitle}>Type it out</span>
              <span className={styles.optionDesc}>
                Fill a short form with your details — takes about 2 minutes.
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
              <span className={styles.optionTitle}>Speak it out</span>
              <span className={styles.optionDesc}>
                Just talk — we will listen and fill the form automatically for you.
              </span>
            </div>
            <span className={styles.badge}>NEW</span>
          </button>

        </div>

        <p className={styles.hint}>🔒 Your information is private and secure.</p>
      </div>
    </div>
  );
}
