import styles from './Hero.module.css';

const PIPELINE = [
  { label: '📍 Location + 💰 Capital + 💡 Idea', gold: true },
  { arrow: true },
  { label: '🌱 Market Analysis' },
  { arrow: true },
  { label: '📊 Financial Calc' },
  { arrow: true },
  { label: '🏛️ Scheme Match' },
  { arrow: true },
  { label: '✅ Feasibility Report', gold: true },
];

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#0E1912" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">

      {/* Badge */}
      <div className={styles.badge}>
        <span className={styles.dot} aria-hidden="true" />
        AI-Powered · Rural First
      </div>

      {/* Headline */}
      <h1 id="hero-heading" className={styles.heading}>
        Your Business.<br />
        <span className={styles.highlight}>Your Village. Your Future.</span>
      </h1>

      {/* Subtext */}
      <p className={styles.sub}>
        Enter your location, available capital, and business idea —
        Agneyaa analyses local demand, calculates finances, selects
        the right government scheme, and delivers a full feasibility report.
      </p>

      {/* Pipeline chips */}
      <div className={styles.pipeline} role="list" aria-label="How Agneyaa works">
        {PIPELINE.map((item, i) =>
          item.arrow
            ? <span key={i} className={styles.arrow} aria-hidden="true">→</span>
            : (
              <div
                key={i}
                role="listitem"
                className={`${styles.chip} ${item.gold ? styles.gold : ''}`}
              >
                {item.label}
              </div>
            )
        )}
      </div>

      {/* CTA */}
      <button className={styles.cta} id="btn-get-started" aria-label="Get Started with Agneyaa">
        Get Started Free
        <ArrowIcon />
      </button>

    </section>
  );
}
