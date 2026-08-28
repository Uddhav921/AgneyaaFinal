import styles from './PageNav.module.css';

/**
 * PageNav — top navigation strip for all onboarding pages.
 * Shows a back arrow (top-left) and an optional forward arrow (top-right).
 *
 * Props:
 *   onBack      — callback for ? ; omit to hide the back arrow
 *   onForward   — callback for ? ; omit to hide the forward arrow
 *   forwardLabel — label for forward button (default "Next")
 *   forwardDisabled — disables the forward button
 */
export default function PageNav({
  onBack,
  onForward,
  forwardLabel = 'Next',
  forwardDisabled = false,
}) {
  return (
    <div className={styles.nav}>
      {/* Back arrow */}
      {onBack ? (
        <button
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back</span>
        </button>
      ) : (
        <span />
      )}

      {/* Forward arrow */}
      {onForward ? (
        <button
          className={`${styles.fwdBtn} ${forwardDisabled ? styles.fwdDisabled : ''}`}
          onClick={onForward}
          disabled={forwardDisabled}
          aria-label="Go forward"
        >
          <span>{forwardLabel}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
