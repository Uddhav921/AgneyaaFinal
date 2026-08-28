import styles from './Onboarding.module.css';

const STEPS = [
  {
    number: '1',
    title: 'User Onboarding',
    icon: '🪪',
    color: 'leaf',
    items: [
      { icon: '🔑', text: 'Register / Login (Google Sign-In)' },
      { icon: '🌐', text: 'Select language & create profile' },
      { icon: '✅', text: 'Consent for data usage' },
    ],
  },
  {
    number: '2',
    title: 'Provide Inputs',
    icon: '📍',
    color: 'gold',
    items: [
      { icon: '📍', text: 'Enter Location (Village, Block, District)' },
      { icon: '💰', text: 'Enter Available Margin Money' },
      { icon: '🏪', text: 'Select Business Category' },
    ],
  },
];

const ArrowRight = () => (
  <div className={styles.arrowWrap} aria-hidden="true">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-muted)" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  </div>
);

export default function Onboarding() {
  return (
    <section className={styles.section} aria-labelledby="onboarding-heading">

      <div className={styles.heading}>
        <span className={styles.label}>How It Works</span>
        <h2 id="onboarding-heading">Two Steps to Your Business Plan</h2>
        <p>Start your journey in minutes — no paperwork, no complexity.</p>
      </div>

      <div className={styles.flow}>
        {STEPS.map((step, idx) => (
          <>
            <div key={step.number} className={`${styles.card} ${styles[step.color]}`}>
              {/* Step number */}
              <div className={styles.stepBadge}>{step.number}</div>

              {/* Card header */}
              <div className={styles.cardHeader}>
                <span className={styles.stepIcon}>{step.icon}</span>
                <h3>{step.title}</h3>
              </div>

              {/* Items list */}
              <ul className={styles.items}>
                {step.items.map((item) => (
                  <li key={item.text} className={styles.item}>
                    <span className={styles.itemIcon}>{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Arrow between steps */}
            {idx < STEPS.length - 1 && <ArrowRight key={`arrow-${idx}`} />}
          </>
        ))}
      </div>

    </section>
  );
}
