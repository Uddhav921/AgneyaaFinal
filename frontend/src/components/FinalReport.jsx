import { useMemo, useRef } from 'react';
import styles from './FinalReport.module.css';

function fmtINR(n) {
  if (!n && n !== 0) return '—';
  if (n >= 10_00_000) return `₹${(n/10_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n/1_000).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
}
function fullINR(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }

/** Compute a feasibility score (0–10) from available data */
function computeScore(bc, moolData) {
  let score = 6.0;
  const capital = Number(bc?.own_capital) || 0;
  if (capital > 200000) score += 1.0;
  else if (capital > 100000) score += 0.5;
  const ratio = moolData ? capital / (moolData.projectCost || capital) : 0.1;
  if (ratio >= 0.2) score += 0.5;
  const goodCat = ['agriculture', 'dairy', 'food', 'retail'];
  if (goodCat.includes(bc?.category)) score += 0.5;
  if (bc?.caste_category === 'SC' || bc?.caste_category === 'ST') score += 0.5;
  if (bc?.land_owned === 'owned') score += 0.3;
  return Math.min(9.8, score).toFixed(1);
}

const RISK_MATRIX = {
  agriculture: [
    { risk: 'Seasonal demand fluctuation', level: 'Medium', mitigation: 'Diversify into 2 crops; dairy supplement' },
    { risk: 'Monsoon dependency', level: 'High',   mitigation: 'Drip irrigation, rain-fed crop insurance (PMFBY)' },
    { risk: 'Market price volatility', level: 'Medium', mitigation: 'Lock-in FPO/APMC contracts early' },
  ],
  retail: [
    { risk: 'Competition from larger stores', level: 'Medium', mitigation: 'Focus on local trust, doorstep delivery' },
    { risk: 'Credit management', level: 'Low',    mitigation: 'Limit credit sales; digital UPI payments' },
    { risk: 'Inventory spoilage', level: 'Low',   mitigation: 'FIFO inventory; cold-chain linkage' },
  ],
  dairy: [
    { risk: 'Animal health risk',   level: 'High',   mitigation: 'NABARD-sponsored vet insurance' },
    { risk: 'Milk price volatility', level: 'Medium', mitigation: 'Link to cooperative (Amul/NDDB)' },
    { risk: 'Feed cost inflation',  level: 'Medium', mitigation: 'Grow green fodder on available land' },
  ],
};

const DOCS_NEEDED = {
  general: ['Aadhaar Card', 'PAN Card', 'Bank Passbook', 'Passport-size Photo', 'Business Plan Document'],
  scheme:  ['Caste Certificate (SC/ST/OBC)', 'Income Certificate', 'Land Ownership/Lease Deed', 'GST Registration (if required)', 'Project Report'],
  bank:    ['6-Month Bank Statement', 'ITR Last 2 Years (if applicable)', 'Property Documents for Collateral'],
};

const ACTION_STEPS = [
  'Finalise your business location and get land/shop agreement',
  'Open a dedicated business bank account (preferably SBI/NABARD empanelled)',
  'Collect all required documents (Aadhaar, PAN, Caste Cert, Income Cert)',
  'Apply for the recommended government scheme at your nearest bank branch',
  'Register on Udyam Portal (MSME registration — free, online)',
  'Start with a pilot/soft launch to validate demand before full investment',
  'Maintain business records from Day 1 for compliance and loan tracking',
];

const CAT_LABELS = {
  agriculture: '🌾 Agriculture', retail: '🏪 Retail', food: '🍱 Food Processing',
  handicraft: '🧵 Handicraft', dairy: '🐄 Dairy', services: '🔧 Services',
  tailoring: '🧶 Tailoring', transport: '🚛 Transport', beauty: '💇 Beauty',
  education: '📚 Education', technology: '💻 Technology', construction: '🏗️ Construction',
};

/**
 * FinalReport — Module 3: Complete Business Feasibility Report.
 *
 * Props:
 *   businessContext  — form data
 *   moolData         — computed financial data from MoolCalculator
 *   onBack           — () => void
 *   onNext           — () => void — proceed to Feedback
 */
export default function FinalReport({ businessContext, moolData, onBack, onNext }) {
  const bc    = businessContext || {};
  const md    = moolData || {};
  const score = useMemo(() => computeScore(bc, md), [bc, md]);
  const scoreNum = parseFloat(score);
  const verdict  = scoreNum >= 7.5 ? 'GO'
                 : scoreNum >= 5.5 ? 'CONDITIONAL GO'
                 : 'NEEDS MORE STUDY';
  const verdictClass = scoreNum >= 7.5 ? styles.verdictGo
                     : scoreNum >= 5.5 ? styles.verdictCond
                     : styles.verdictNo;

  const risks = RISK_MATRIX[bc.category] || RISK_MATRIX.retail;
  const cat   = CAT_LABELS[bc.category] || bc.category || 'Business';
  const scheme = md.scheme || { name: 'PMEGP', rate: 9.0, subsidy: '15–35%' };

  const factors = [
    { label: 'Market Potential',  val: Math.min(95, 60 + (scoreNum - 5) * 14) },
    { label: 'Financial Viability', val: Math.min(90, 55 + (Number(bc.own_capital) || 0) / 5000) },
    { label: 'Location Advantage',  val: 70 },
    { label: 'Scheme Eligibility',  val: bc.caste_category !== 'General' ? 85 : 65 },
  ];

  const reportRef = useRef(null);
  const handlePrint = () => window.print();

  return (
    <div className={styles.wrap} ref={reportRef}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className={styles.badge}>📊 Module 3 — Final Report</span>
          <h2 className={styles.title}>Business Feasibility Report</h2>
          <p className={styles.subtitle}>
            Complete analysis combining Beej AI insights + Mool financial data · {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.printBtn} onClick={handlePrint}>🖨️ Print / Save PDF</button>
          <button className={styles.feedbackBtn} onClick={onNext}>⭐ Give Feedback →</button>
        </div>
      </div>

      {/* Feasibility Score Card */}
      <div className={styles.scoreSection}>
        <div className={styles.scoreBig}>
          <div className={styles.scoreNum}>{score}</div>
          <div className={styles.scoreOf}>out of 10</div>
          <div className={styles.scoreLabel}>Feasibility Score</div>
        </div>
        <div className={styles.scoreMeta}>
          <div className={styles.scoreVerdict}>
            Verdict: <span className={verdictClass}>{verdict}</span>
          </div>
          <div className={styles.scoreDesc}>
            {scoreNum >= 7.5
              ? `Your ${bc.business_idea || 'business'} in ${bc.village || bc.district || 'your area'} shows strong market potential and financial viability. Recommended to proceed with scheme application.`
              : scoreNum >= 5.5
              ? `Your business idea is viable with some conditions. Focus on the high-risk areas and consider starting at a smaller scale before full investment.`
              : `More market research and capital planning is recommended before proceeding. Consider consulting a field advisor.`
            }
          </div>
          <div className={styles.scoreFactors}>
            {factors.map(f => (
              <span key={f.label} className={styles.scoreFactor}>
                <span style={{ fontSize: '0.68rem' }}>{f.label}</span>
                <div className={styles.factorBar}>
                  <div className={styles.factorFill} style={{ width: `${f.val}%` }} />
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--leaf)', fontWeight: 700 }}>{Math.round(f.val)}%</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.grid}>

        {/* Business Profile */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>🏢 Business Profile</div>
          <table className={styles.profileTable}>
            <tbody>
              {[
                ['Entrepreneur', bc.full_name || '—'],
                ['Business Idea', bc.business_idea || '—'],
                ['Category', cat],
                ['Location', [bc.village, bc.block, bc.district].filter(Boolean).join(', ') || '—'],
                ['Own Capital', fmtINR(Number(bc.own_capital)) || '—'],
                ['Caste Category', bc.caste_category || '—'],
                ['Land Ownership', bc.land_owned || '—'],
                ['Target Customers', bc.target_customers || '—'],
              ].map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Market Analysis */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>📊 Market Analysis</div>
          <div className={styles.analysisList}>
            <div className={styles.analysisItem}>
              <span className={styles.aBullet}>🟢</span>
              <span><strong>Location Data:</strong> {bc.village || 'Your location'}, {bc.district} resolved via India Post API. Block: {bc.block || 'N/A'}.</span>
            </div>
            <div className={styles.analysisItem}>
              <span className={styles.aBullet}>🟡</span>
              <span><strong>Market Demand:</strong> Estimated moderate-to-high demand for {cat} in rural areas of {bc.district || 'your district'}.</span>
            </div>
            <div className={styles.analysisItem}>
              <span className={styles.aBullet}>🟡</span>
              <span><strong>Competition Level:</strong> Medium competition typical for {cat} in tier-3 districts. Differentiation through quality and local trust is key.</span>
            </div>
            <div className={styles.analysisItem}>
              <span className={styles.aBullet}>🟡</span>
              <span><strong>Revenue Estimate:</strong> Monthly revenue of {fmtINR(Number(bc.own_capital) * 0.15)} – {fmtINR(Number(bc.own_capital) * 0.25)} achievable in 6–12 months based on capital investment.</span>
            </div>
            <div className={styles.analysisItem}>
              <span className={styles.aBullet}>🔵</span>
              <span><strong>Target Market:</strong> {bc.target_customers || 'Local households and community members'}.</span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>💰 Financial Overview</div>
          <div className={styles.finGrid}>
            <div className={styles.finItem}>
              <div className={styles.finLabel}>Project Cost</div>
              <div className={styles.finValue}>{fmtINR(md.projectCost || Number(bc.own_capital) * 10)}</div>
            </div>
            <div className={styles.finItem}>
              <div className={styles.finLabel}>Own Capital</div>
              <div className={`${styles.finValue} ${styles.green}`}>{fmtINR(Number(bc.own_capital))}</div>
            </div>
            <div className={styles.finItem}>
              <div className={styles.finLabel}>Net Loan Amount</div>
              <div className={`${styles.finValue} ${styles.gold}`}>{fmtINR(md.netLoan || Number(bc.own_capital) * 8)}</div>
            </div>
            <div className={styles.finItem}>
              <div className={styles.finLabel}>Monthly EMI</div>
              <div className={`${styles.finValue} ${styles.blue}`}>{fmtINR(md.emi || 0)}</div>
            </div>
            <div className={styles.finItem}>
              <div className={styles.finLabel}>Govt. Subsidy</div>
              <div className={`${styles.finValue} ${styles.green}`}>{fmtINR(md.subsidy || 0)}</div>
            </div>
            <div className={styles.finItem}>
              <div className={styles.finLabel}>Working Capital</div>
              <div className={styles.finValue}>{fmtINR(md.workingCap || 0)}</div>
            </div>
          </div>
          {md.scheme && (
            <div style={{ background: 'rgba(111,187,124,0.06)', border: '1px solid rgba(111,187,124,0.15)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.77rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--leaf)' }}>{scheme.name}</strong> · {scheme.rate}% p.a. · Subsidy: {scheme.subsidy} · Moratorium: {scheme.moratorium || 0} months
            </div>
          )}
        </div>

        {/* Risk Assessment */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>⚠️ Risk Assessment</div>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.riskTable}>
              <thead>
                <tr><th>Risk Factor</th><th>Level</th><th>Mitigation</th></tr>
              </thead>
              <tbody>
                {risks.map((r, i) => (
                  <tr key={i}>
                    <td>{r.risk}</td>
                    <td className={r.level === 'High' ? styles.riskHigh : r.level === 'Medium' ? styles.riskMedium : styles.riskLow}>{r.level}</td>
                    <td>{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Checklist */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>📋 Document Checklist</div>
          <div className={styles.checklist}>
            {[...DOCS_NEEDED.general, ...DOCS_NEEDED.scheme].map((doc, i) => (
              <div key={i} className={styles.checkItem}>
                <div className={`${styles.checkBox} ${i < 5 ? styles.checked : ''}`}>
                  {i < 5 ? '✓' : ''}
                </div>
                <span style={{ fontSize: '0.78rem' }}>{doc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Plan */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>✅ Action Plan — Next Steps</div>
          <div className={styles.actionList}>
            {ACTION_STEPS.map((step, i) => (
              <div key={i} className={styles.actionItem}>
                <div className={styles.actionNum}>{i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>← Back to Financial Plan</button>
        <span className={styles.footerNote}>
          🟢 API Data · 🔵 User Data · 🟡 Estimated by Beej AI. Consult a bank officer for final verification.
        </span>
        <button className={styles.nextBtn} onClick={onNext}>
          ⭐ Give Feedback →
        </button>
      </div>

    </div>
  );
}
