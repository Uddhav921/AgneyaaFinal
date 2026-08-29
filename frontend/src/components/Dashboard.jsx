import styles from './Dashboard.module.css';

const CAT_LABELS = {
  agriculture: '🌾 Agriculture', retail: '🏪 Retail', food: '🍱 Food Processing',
  handicraft: '🧵 Handicraft', dairy: '🐄 Dairy', services: '🔧 Services',
  tailoring: '🧶 Tailoring', transport: '🚛 Transport', beauty: '💇 Beauty',
  education: '📚 Education', technology: '💻 Technology', construction: '🏗️ Construction',
};

function fmtINR(n) {
  if (!n) return '—';
  if (n >= 10_00_000) return `₹${(n/10_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n/1_000).toFixed(0)}K`;
  return `₹${n}`;
}

/**
 * Dashboard — hub page showing all 4 modules.
 *
 * Props:
 *   businessContext  — form data
 *   user             — Supabase user
 *   completedModules — { m1, m2, m3, m4 } booleans
 *   onModule         — (module: 'chat'|'mool'|'report'|'feedback') => void
 *   onEditInputs     — () => void — re-opens the input form
 */
export default function Dashboard({ businessContext, user, completedModules = {}, onModule, onEditInputs }) {
  const bc = businessContext || {};
  const name = user?.user_metadata?.full_name || bc.full_name || 'Entrepreneur';
  const cat  = CAT_LABELS[bc.category] || bc.category || 'Business';

  const totalDone = [completedModules.m1, completedModules.m2, completedModules.m3, completedModules.m4].filter(Boolean).length;
  const progressPct = Math.round((totalDone / 4) * 100);

  const modules = [
    {
      id: 'm1',
      stateKey: 'chat',
      tag: 'Module 1',
      icon: '🌱',
      title: 'Beej Analysis',
      desc: 'AI-powered market feasibility analysis with live data from India Post, OSM, and Agmarknet.',
      features: ['Market Reach Estimation', 'Opportunity Analysis', 'SWOT & Threats', 'Competitor Mapping', 'Product Market Value'],
      btnLabel: completedModules.m1 ? 'Continue Chat' : 'Start Analysis',
      status: completedModules.m1 ? 'done' : 'active',
      cls: styles.m1,
    },
    {
      id: 'm2',
      stateKey: 'mool',
      tag: 'Module 2',
      icon: '💰',
      title: 'Mool Financial Plan',
      desc: 'Project cost calculator, loan & EMI planner, government scheme auto-selection.',
      features: ['Project Cost Calculation', 'Scheme Auto-Selection', 'Loan Amount (90%)', 'EMI Schedule', 'Working Capital Estimate'],
      btnLabel: completedModules.m2 ? 'View Calculations' : 'Calculate Financials',
      status: completedModules.m2 ? 'done' : completedModules.m1 ? 'active' : 'locked',
      cls: styles.m2,
      locked: !completedModules.m1,
    },
    {
      id: 'm3',
      stateKey: 'report',
      tag: 'Module 3',
      icon: '📊',
      title: 'Final Report',
      desc: 'Complete business feasibility report combining Beej + Mool data into an actionable document.',
      features: ['Complete Business Analysis', 'Business Report', 'Overall Feasibility Score', 'Conclusion & Recommendations'],
      btnLabel: completedModules.m3 ? 'View Report' : 'Generate Report',
      status: completedModules.m3 ? 'done' : completedModules.m2 ? 'active' : 'locked',
      cls: styles.m3,
      locked: !completedModules.m2,
    },
    {
      id: 'm4',
      stateKey: 'feedback',
      tag: 'Module 4',
      icon: '⭐',
      title: 'Feedback',
      desc: 'Share your experience, rate accuracy, and suggest improvements for the platform.',
      features: ['Star Rating', 'Platform Feedback', 'Suggestions for improvement', 'Community Insights'],
      btnLabel: completedModules.m4 ? 'Submitted ✓' : 'Give Feedback',
      status: completedModules.m4 ? 'done' : completedModules.m3 ? 'active' : 'locked',
      cls: styles.m4,
      locked: !completedModules.m3,
    },
  ];

  return (
    <div className={styles.wrap}>

      {/* Welcome Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerTop}>
          <div className={styles.welcomeText}>
            <span className={styles.welcomeHi}>Welcome back</span>
            <h1 className={styles.welcomeName}>🌱 {name}</h1>
            <p className={styles.welcomeBiz}>
              <strong>{bc.business_idea?.slice(0, 55) || cat}</strong>
              {bc.village ? ` · ${bc.village}, ${bc.district || ''}` : ''}
            </p>
          </div>
          <button className={styles.editBtn} onClick={onEditInputs}>
            ✏️ Edit My Details
          </button>
        </div>

        <div className={styles.progress}>
          <span className={styles.progressLabel}>Overall Progress</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <span className={styles.progressPct}>{totalDone}/4 Modules · {progressPct}%</span>
        </div>
      </div>

      {/* Context chips */}
      <div className={styles.chips}>
        {bc.district    && <div className={styles.chip}><span>📍</span>{bc.district}</div>}
        {bc.category    && <div className={styles.chip}><span>🏷️</span>{cat}</div>}
        {bc.own_capital && <div className={styles.chip}><span>💵</span>{fmtINR(Number(bc.own_capital))} Capital</div>}
        {bc.caste_category && <div className={styles.chip}><span>📋</span>{bc.caste_category}</div>}
        {bc.land_owned  && <div className={styles.chip}><span>🏡</span>{bc.land_owned}</div>}
      </div>

      {/* Main Body */}
      <div className={styles.body}>
        <div className={styles.sectionTitle}>Your Modules</div>

        {/* 4 Module Cards */}
        <div className={styles.moduleGrid}>
          {modules.map(mod => (
            <button
              key={mod.id}
              className={`${styles.moduleCard} ${styles[mod.id]} ${mod.locked ? styles.locked : ''} ${mod.status === 'done' ? styles.done : ''} ${mod.status === 'active' ? styles.active : ''}`}
              onClick={() => !mod.locked && onModule?.(mod.stateKey)}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardIcon}>{mod.icon}</div>
                <span className={`${styles.statusBadge} ${styles[mod.status]}`}>
                  {mod.status === 'done'   ? '✓ Complete' :
                   mod.status === 'active' ? '→ Active'   :
                   mod.status === 'locked' ? '🔒 Locked'  : 'Pending'}
                </span>
              </div>
              <div>
                <div className={styles.cardModTag}>{mod.tag}</div>
                <div className={styles.cardTitle}>{mod.title}</div>
              </div>
              <div className={styles.cardDesc}>{mod.desc}</div>
              <div className={styles.cardFeatures}>
                {mod.features.map((f, i) => (
                  <span key={i} className={styles.cardFeature}>{f}</span>
                ))}
              </div>
              <div className={styles.cardAction}>
                <span className={styles.cardBtn}>
                  {mod.locked ? '🔒 Locked' : mod.btnLabel} {!mod.locked && '→'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Info cards */}
        <div className={styles.sectionTitle}>Your Business Overview</div>
        <div className={styles.infoRow}>
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>💡 Business Idea</div>
            <div className={styles.infoCardValue}>{bc.business_idea?.slice(0, 40) || '—'}</div>
            <div className={styles.infoCardSub}>{cat}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>💵 Available Capital</div>
            <div className={styles.infoCardValue}>{fmtINR(Number(bc.own_capital)) || '—'}</div>
            <div className={styles.infoCardSub}>Own funds available</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>📍 Location</div>
            <div className={styles.infoCardValue}>{bc.village || '—'}</div>
            <div className={styles.infoCardSub}>{[bc.block, bc.district].filter(Boolean).join(', ')}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
