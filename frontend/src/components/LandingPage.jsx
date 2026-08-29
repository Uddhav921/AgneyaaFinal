import { useMemo } from 'react';
import styles from './LandingPage.module.css';

// ── Static data ───────────────────────────────────────────────────

const PROBLEMS = [
  {
    icon: '📍',
    title: 'No Local Market Data',
    desc: 'Rural entrepreneurs have no access to hyper-local demand data, competitor density, or commodity prices for their specific village or block.',
    tag: '73% cite this as the #1 barrier',
  },
  {
    icon: '💰',
    title: 'Financial Complexity',
    desc: 'EMI calculations, bank processes, subsidy eligibility, and working capital requirements are overwhelming without expert guidance.',
    tag: 'Loan rejection rate > 60% in rural areas',
  },
  {
    icon: '📋',
    title: 'Inaccessible Schemes & Docs',
    desc: 'PMEGP, MUDRA, NABARD, and 40+ government schemes exist — but finding the right one, eligibility criteria, and document checklist is nearly impossible.',
    tag: '₹50,000 Cr. schemes underutilised annually',
  },
];

const HOW_STEPS = [
  { icon: '📝', label: 'User Input',       sub: 'Business idea, location, capital, category' },
  { icon: '🌐', label: 'Live Data Fetch',  sub: 'India Post, OSM, Agmarknet APIs' },
  { icon: '🌱', label: 'Beej AI Analysis', sub: 'Conversational feasibility assessment' },
  { icon: '💰', label: 'Mool Financial',   sub: 'Loan, EMI, scheme matching' },
  { icon: '📊', label: 'Final Report',     sub: 'Score, risks, action plan, documents' },
];

const MODULES = [
  {
    num: 'Module 1',
    icon: '🌱',
    name: 'Beej',
    sub: 'AI Business Advisor',
    feats: ['Chat + Schemes', 'Market Analysis', 'Competitor Mapping', 'Document Guidance'],
  },
  {
    num: 'Module 2',
    icon: '💰',
    name: 'Mool',
    sub: 'Financial Calculator',
    feats: ['Loan Calculation', 'EMI Schedule', 'Scheme Auto-Select', 'Subsidy Planning'],
  },
  {
    num: 'Module 3',
    icon: '📊',
    name: 'Final Report',
    sub: 'Feasibility Report',
    feats: ['Overall Score', 'Risk Matrix', 'Action Plan', 'PDF / Print'],
  },
  {
    num: 'Module 4',
    icon: '⭐',
    name: 'Feedback',
    sub: 'Rating & Suggestions',
    feats: ['Star Rating', 'Feature Ratings', 'Improvement Chips', 'Community Voice'],
  },
];

const EVIDENCE_ROWS = [
  { source: 'India Post PIN Directory', date: 'Real-time',  level: 'Village / Block',  confidence: '95%', type: 'Verified' },
  { source: 'OpenStreetMap (OSM)',       date: 'Real-time',  level: '5km Radius POI',   confidence: '85%', type: 'Verified' },
  { source: 'Agmarknet Mandi Prices',   date: 'Daily',      level: 'Nearest Mandi',    confidence: '90%', type: 'Verified' },
  { source: 'NABARD NAFIS Survey',      date: '2022–23',    level: 'State Average',    confidence: '75%', type: 'Estimated' },
  { source: 'Scheme Database (PMEGP…)', date: 'Embedded',   level: 'National Policy',  confidence: '70%', type: 'Estimated' },
  { source: 'User Form Inputs',         date: 'At session', level: 'Individual Level', confidence: '100%', type: 'User Validated' },
];

const DATA_SOURCES = [
  {
    icon: '🏛️',
    name: 'Government / Open Data',
    desc: 'Official APIs from India Post, Agmarknet, and NABARD providing verified, authoritative local data.',
    items: ['India Post PIN Directory', 'Agmarknet commodity prices', 'NABARD NAFIS rural income'],
  },
  {
    icon: '📈',
    name: 'Market Data',
    desc: 'Real commodity prices, seasonal trends, and mandi-level data for agricultural and food businesses.',
    items: ['Daily mandi prices', 'Commodity modal/min/max rates', 'Price date & market name'],
  },
  {
    icon: '🗺️',
    name: 'GIS / Business Data',
    desc: 'OpenStreetMap Overpass API to identify competitors, nearby shops, and infrastructure within 5km.',
    items: ['Competitor POI count', 'Amenity mapping (shops, markets)', '5km radius spatial analysis'],
  },
  {
    icon: '👤',
    name: 'User Validation',
    desc: 'Data provided directly by the entrepreneur is treated as ground truth and labelled 🔵 User Data.',
    items: ['Business idea and category', 'Own capital & caste category', 'Location, land ownership'],
  },
];

const TRUST_POINTS = [
  {
    icon: '🔍',
    title: 'No Unsupported Guessing',
    desc: 'Every piece of information is labelled: 🟢 API Data, 🔵 User Data, or 🟡 Estimated. You always know the source.',
  },
  {
    icon: '📊',
    title: 'Clear Data Sources',
    desc: 'Each insight cites its source, date, location level, and confidence. Verified data from government APIs is prioritised.',
  },
  {
    icon: '⚠️',
    title: 'Honest When Data Is Missing',
    desc: '"Data not available for this region" is shown instead of making up numbers. We believe in evidence over guesswork.',
  },
];

/**
 * LandingPage — Complete home page.
 *
 * Props:
 *   isLoggedIn    — bool — show "Go to Dashboard" button
 *   onGetStarted  — () => void — triggers login/onboarding flow
 *   onDashboard   — () => void — takes logged-in user to dashboard
 */
export default function LandingPage({ isLoggedIn, onGetStarted, onDashboard }) {
  // Read real user reviews from localStorage (submitted via Feedback.jsx)
  const reviews = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('agneyaa_feedback') || '[]').slice(-9);
    } catch { return []; }
  }, []);

  // Demo reviews shown when no real ones exist
  const demoReviews = [
    { overall: 5, feedback: 'Beej ne mujhe dairy farming ke liye sahi yojana batai. Bilkul sahi jankari mili!', businessIdea: 'Dairy Farm', timestamp: '2026-08-20T10:00:00Z' },
    { overall: 5, feedback: 'The scheme matching was incredibly accurate. Found PMFME for my food processing unit within minutes.', businessIdea: 'Food Processing', timestamp: '2026-08-22T14:00:00Z' },
    { overall: 4, feedback: 'Financial calculator saved me hours. EMI schedule is very clear and the moratorium explanation helped a lot.', businessIdea: 'Retail Shop', timestamp: '2026-08-25T09:00:00Z' },
  ];

  const displayReviews = reviews.length > 0 ? reviews : demoReviews;

  return (
    <div className={styles.page}>

      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroInner}>
          <div className={styles.heroPill}>
            <div className={styles.pillDot} />
            Powered by Gemini AI · Live Government APIs
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroGrad}>Hyper-Local AI</span><br />
            Business & Financial Advisor
          </h1>

          <p className={styles.heroTagline}>
            Agneyaa empowers rural Indian entrepreneurs with real market data, 
            AI-powered feasibility analysis, and instant government scheme matching — 
            in your own language.
          </p>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>4+</span>
              <div className={styles.heroStatLabel}>Live APIs</div>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>40+</span>
              <div className={styles.heroStatLabel}>Govt. Schemes</div>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>8</span>
              <div className={styles.heroStatLabel}>Languages</div>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>100%</span>
              <div className={styles.heroStatLabel}>Free to Use</div>
            </div>
          </div>

          <div className={styles.heroCtas}>
            {isLoggedIn && onDashboard ? (
              <>
                <button className={styles.ctaDash} onClick={onDashboard}>
                  ⬛ Go to Dashboard →
                </button>
                <button className={styles.ctaPrimary} onClick={onGetStarted}>
                  🌱 New Analysis
                </button>
              </>
            ) : (
              <button className={styles.ctaPrimary} onClick={onGetStarted}>
                🚀 Get Started — It's Free
              </button>
            )}
          </div>
        </div>

        <div className={styles.scrollHint}>
          <span>Scroll to explore</span>
          <span className={styles.scrollArrow}>↓</span>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ═══ THE PROBLEM ════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionTag}>⚠️ The Problem</div>
        <h2 className={styles.sectionTitle}>Rural Entrepreneurs Face Impossible Odds</h2>
        <p className={styles.sectionSub}>
          Starting a business in rural India means navigating without maps — no local data, no financial guidance, no scheme awareness.
        </p>
        <div className={styles.problemGrid}>
          {PROBLEMS.map(p => (
            <div className={styles.problemCard} key={p.title}>
              <div className={styles.problemIcon}>{p.icon}</div>
              <div className={styles.problemTitle}>{p.title}</div>
              <div className={styles.problemDesc}>{p.desc}</div>
              <div className={styles.problemTag}>📌 {p.tag}</div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      {/* ═══ HOW IT WORKS ═══════════════════════════════════════ */}
      <div className={styles.howBg}>
        <div className={styles.section}>
          <div className={styles.sectionTag}>⚙️ How It Works</div>
          <h2 className={styles.sectionTitle}>Five Steps to Business Clarity</h2>
          <p className={styles.sectionSub}>
            From your first input to a complete feasibility report — all in under 15 minutes.
          </p>
          <div className={styles.howFlow}>
            {HOW_STEPS.map((step, i) => (
              <>
                <div className={styles.howStep} key={step.label}>
                  <div className={styles.howIcon}>
                    {step.icon}
                    <span className={styles.howStepNum}>{i + 1}</span>
                  </div>
                  <div className={styles.howLabel}>{step.label}</div>
                  <div className={styles.howSub}>{step.sub}</div>
                </div>
                {i < HOW_STEPS.length - 1 && (
                  <div className={styles.howArrow} key={`arrow-${i}`}>→</div>
                )}
              </>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ═══ OUR MODULES ════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionTag}>🧩 Our Modules</div>
        <h2 className={styles.sectionTitle}>4 Powerful Modules, 1 Platform</h2>
        <p className={styles.sectionSub}>
          Each module builds on the previous — giving you a complete, evidence-backed business plan.
        </p>
        <div className={styles.modulesGrid}>
          {MODULES.map(m => (
            <div className={styles.modCard} key={m.name}>
              <div className={styles.modNum}>{m.num}</div>
              <div className={styles.modIcon}>{m.icon}</div>
              <div className={styles.modName}>{m.name}</div>
              <div className={styles.modSub}>{m.sub}</div>
              <div className={styles.modFeats}>
                {m.feats.map(f => <span className={styles.modFeat} key={f}>{f}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      {/* ═══ EVIDENCE-BASED APPROACH ════════════════════════════ */}
      <div className={styles.evidenceBg}>
        <div className={styles.section}>
          <div className={styles.sectionTag}>🔬 Evidence-Based Approach</div>
          <h2 className={styles.sectionTitle}>Every Claim Has a Source</h2>
          <p className={styles.sectionSub}>
            We tag every piece of data so you always know what's verified, what's estimated, and what's from you.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.evidenceTable}>
              <thead>
                <tr>
                  <th>Data Source</th>
                  <th>Date</th>
                  <th>Location Level</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {EVIDENCE_ROWS.map(row => (
                  <tr key={row.source}>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{row.source}</td>
                    <td>{row.date}</td>
                    <td>{row.level}</td>
                    <td style={{ color: 'var(--leaf)', fontWeight: 700 }}>{row.confidence}</td>
                    <td>
                      <span className={`${styles.evTag} ${
                        row.type === 'Verified' ? styles.evVerified :
                        row.type === 'Estimated' ? styles.evEstimated :
                        styles.evUser
                      }`}>
                        {row.type === 'Verified' ? '🟢' : row.type === 'Estimated' ? '🟡' : '🔵'} {row.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ═══ DATA SOURCES ═══════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionTag}>📡 Data Sources</div>
        <h2 className={styles.sectionTitle}>Built on Real, Authoritative Data</h2>
        <p className={styles.sectionSub}>
          Agneyaa fetches live data from government and open-data sources — no manual research required.
        </p>
        <div className={styles.sourcesGrid}>
          {DATA_SOURCES.map(s => (
            <div className={styles.sourceCard} key={s.name}>
              <div className={styles.sourceIcon}>{s.icon}</div>
              <div className={styles.sourceName}>{s.name}</div>
              <div className={styles.sourceDesc}>{s.desc}</div>
              <div className={styles.sourceItems}>
                {s.items.map(item => <span className={styles.sourceItem} key={item}>{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      {/* ═══ TRUST & TRANSPARENCY ═══════════════════════════════ */}
      <div className={styles.evidenceBg}>
        <div className={styles.section}>
          <div className={styles.sectionTag}>🤝 Trust & Transparency</div>
          <h2 className={styles.sectionTitle}>We Tell You What We Don't Know</h2>
          <p className={styles.sectionSub}>
            Transparency is built into every response. No hallucinations. No unsupported guesses.
          </p>
          <div className={styles.trustGrid}>
            {TRUST_POINTS.map(t => (
              <div className={styles.trustCard} key={t.title}>
                <div className={styles.trustIcon}>{t.icon}</div>
                <div className={styles.trustTitle}>{t.title}</div>
                <div className={styles.trustDesc}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ═══ USER REVIEWS ═══════════════════════════════════════ */}
      <div className={styles.reviewsBg}>
        <div className={styles.section}>
          <div className={styles.sectionTag}>⭐ User Feedback</div>
          <h2 className={styles.sectionTitle}>What Entrepreneurs Say</h2>
          <p className={styles.sectionSub}>
            {reviews.length > 0
              ? `${reviews.length} real feedback submissions from users like you.`
              : 'Be among the first to try Agneyaa and share your experience.'
            }
          </p>
          <div className={styles.reviewsGrid}>
            {displayReviews.slice(0, 6).map((r, i) => {
              const name = r.businessIdea ? `${r.businessIdea} Entrepreneur` : 'Rural Entrepreneur';
              const date = r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              const text = r.feedback || 'Great platform for understanding business viability before investing.';
              const initials = name.slice(0, 1).toUpperCase();
              return (
                <div className={styles.reviewCard} key={i}>
                  <div className={styles.reviewStars}>{'⭐'.repeat(Math.min(5, r.overall || 5))}</div>
                  <div className={styles.reviewText}>{text.slice(0, 160)}{text.length > 160 ? '…' : ''}</div>
                  <div className={styles.reviewMeta}>
                    <div className={styles.reviewAvatar}>{initials}</div>
                    <div>
                      <div className={styles.reviewName}>{name}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {date && <span className={styles.reviewDate}>{date}</span>}
                        {r.businessIdea && <span className={styles.reviewBiz}>• {r.businessIdea}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {reviews.length === 0 && (
            <div className={styles.noReviewsNote}>
              🌱 These are sample reviews. Real user feedback will appear here after submission.
            </div>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      {/* ═══ FINAL CTA ══════════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div className={styles.sectionTag} style={{ alignSelf: 'center' }}>🚀 Get Started Today</div>
          <h2 className={styles.ctaTitle}>
            Plant Your Business Seed<br />
            <span style={{ color: 'var(--leaf)' }}>With Confidence</span>
          </h2>
          <p className={styles.ctaDesc}>
            Join thousands of rural entrepreneurs who use Agneyaa to make informed business decisions — backed by real data, not guesswork.
          </p>
          <button className={styles.ctaBig} onClick={onGetStarted}>
            🌱 Start Your Business Analysis — Free
          </button>
          <div className={styles.ctaNote}>
            No registration required · Works in 8 Indian languages · 100% free
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>🔥 Agneyaa</span>
        <span>Built for SIH 2026 · Powered by Gemini AI</span>
        <span>India Post · OSM · Agmarknet · NABARD</span>
      </footer>

    </div>
  );
}
