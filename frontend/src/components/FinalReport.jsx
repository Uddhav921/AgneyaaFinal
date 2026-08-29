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

  const handlePrint = () => {
    const el = reportRef.current;
    if (!el) return;

    // Collect the report HTML
    const content = el.innerHTML;
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Agneyaa Feasibility Report — ${bc.full_name || 'Business'}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      color: #1a1a1a;
      font-size: 13px;
      line-height: 1.5;
      padding: 2.5cm 2cm;
    }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin: 18px 0 6px; color: #1a5c2a; }
    h3 { font-size: 13px; margin: 12px 0 4px; color: #2d7a3d; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th { background: #e8f5ea; color: #1a5c2a; padding: 6px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #6FBB7C; }
    td { padding: 5px 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
    tr:last-child td { border-bottom: none; }
    .header { border-bottom: 3px solid #6FBB7C; padding-bottom: 12px; margin-bottom: 20px; }
    .brand { font-size: 12px; color: #6FBB7C; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
    .meta  { font-size: 11px; color: #666; margin-top: 4px; }
    .score-box { display: flex; align-items: center; gap: 20px; background: #f0f9f0; border: 1.5px solid #6FBB7C; border-radius: 10px; padding: 14px 18px; margin: 14px 0; }
    .score-num { font-size: 40px; font-weight: 900; color: #1a5c2a; line-height: 1; }
    .score-info { flex: 1; }
    .verdict { font-size: 14px; font-weight: 800; color: #2d7a3d; margin-bottom: 4px; }
    .verdict-desc { font-size: 12px; color: #444; }
    .card { border: 1px solid #d4e8d4; border-radius: 8px; padding: 14px; margin: 12px 0; break-inside: avoid; }
    .card-title { font-size: 12px; font-weight: 800; color: #1a5c2a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
    .fin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .fin-item { background: #f8fdf8; border: 1px solid #c8e0c8; border-radius: 6px; padding: 8px 10px; }
    .fin-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.06em; }
    .fin-value { font-size: 15px; font-weight: 800; color: #1a5c2a; }
    .risk-high   { color: #c0392b; font-weight: 700; }
    .risk-medium { color: #e67e22; font-weight: 700; }
    .risk-low    { color: #27ae60; font-weight: 700; }
    .check-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; }
    .check-box  { width: 16px; height: 16px; border: 1.5px solid #6FBB7C; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #1a5c2a; flex-shrink: 0; }
    .action-item { display: flex; gap: 10px; align-items: flex-start; padding: 5px 0; font-size: 12px; }
    .action-num { width: 22px; height: 22px; background: #6FBB7C; color: #0E1912; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
    .footer-note { margin-top: 28px; padding-top: 14px; border-top: 1px solid #ccc; font-size: 10px; color: #888; text-align: center; }
    .factors { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }
    .factor-row { display: flex; align-items: center; gap: 8px; font-size: 11px; }
    .factor-bar { flex: 1; height: 6px; background: #e8e8e8; border-radius: 99px; overflow: hidden; }
    .factor-fill { height: 100%; background: #6FBB7C; border-radius: 99px; }
    .tag { display: inline-block; background: #e8f5ea; color: #1a5c2a; border-radius: 99px; padding: 1px 7px; font-size: 10px; font-weight: 700; border: 1px solid #c0dfc0; margin-bottom: 6px; }
    @media print { body { padding: 1.5cm 1cm; } .card { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">🔥 Agneyaa · Business Feasibility Report</div>
    <h1>${bc.full_name || 'Entrepreneur'} — ${bc.business_idea || 'Business Plan'}</h1>
    <div class="meta">
      Category: ${cat} &nbsp;·&nbsp;
      Location: ${[bc.village, bc.block, bc.district].filter(Boolean).join(', ') || '—'} &nbsp;·&nbsp;
      Date: ${dateStr} &nbsp;·&nbsp;
      Generated by Agneyaa AI Platform
    </div>
  </div>

  <div class="score-box">
    <div class="score-num">${score}</div>
    <div class="score-info">
      <div class="verdict">Verdict: ${verdict}</div>
      <div class="verdict-desc">
        ${scoreNum >= 7.5
          ? `Your ${bc.business_idea || 'business'} in ${bc.village || bc.district || 'your area'} shows strong market potential. Recommended to proceed with scheme application.`
          : scoreNum >= 5.5
          ? `Viable with conditions. Start smaller scale, address high-risk areas first.`
          : `More market research and capital planning recommended before proceeding.`
        }
      </div>
      <div class="factors">
        ${factors.map(f => `
          <div class="factor-row">
            <span style="min-width:120px">${f.label}</span>
            <div class="factor-bar"><div class="factor-fill" style="width:${f.val}%"></div></div>
            <span style="color:#1a5c2a;font-weight:700">${Math.round(f.val)}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">🏢 Business Profile</div>
    <table>
      <tbody>
        ${[
          ['Entrepreneur', bc.full_name || '—'],
          ['Business Idea', bc.business_idea || '—'],
          ['Category', cat],
          ['Location', [bc.village, bc.block, bc.district].filter(Boolean).join(', ') || '—'],
          ['Own Capital', fmtINR(Number(bc.own_capital)) || '—'],
          ['Caste Category', bc.caste_category || '—'],
          ['Land Ownership', bc.land_owned || '—'],
          ['Target Customers', bc.target_customers || '—'],
        ].map(([k, v]) => `<tr><td style="font-weight:600;width:35%">${k}</td><td>${v}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-title">💰 Financial Overview</div>
    <div class="fin-grid">
      ${[
        ['Project Cost', fmtINR(md.projectCost || Number(bc.own_capital) * 10)],
        ['Own Capital', fmtINR(Number(bc.own_capital))],
        ['Net Loan', fmtINR(md.netLoan || Number(bc.own_capital) * 8)],
        ['Monthly EMI', fmtINR(md.emi || 0)],
        ['Govt. Subsidy', fmtINR(md.subsidy || 0)],
        ['Working Capital', fmtINR(md.workingCap || 0)],
      ].map(([l, v]) => `<div class="fin-item"><div class="fin-label">${l}</div><div class="fin-value">${v}</div></div>`).join('')}
    </div>
    ${md.scheme ? `<p style="margin-top:10px;font-size:12px;color:#555"><strong style="color:#1a5c2a">${scheme.name}</strong> · ${scheme.rate}% p.a. · Subsidy: ${scheme.subsidy} · Moratorium: ${scheme.moratorium || 0} months</p>` : ''}
  </div>

  <div class="card">
    <div class="card-title">📊 Market Analysis</div>
    <ul style="padding-left:16px;margin:0;font-size:12px;line-height:1.7">
      <li><strong>Location:</strong> ${bc.village || 'Your location'}, ${bc.district} — verified via India Post API.</li>
      <li><strong>Market Demand:</strong> Estimated moderate-to-high demand for ${cat} in rural ${bc.district || 'your district'}.</li>
      <li><strong>Competition:</strong> Medium competition typical for ${cat}. Local trust and quality are key differentiators.</li>
      <li><strong>Revenue Estimate:</strong> Monthly ₹${Math.round(Number(bc.own_capital) * 0.15 / 1000)}K–₹${Math.round(Number(bc.own_capital) * 0.25 / 1000)}K achievable in 6–12 months.</li>
      <li><strong>Target Market:</strong> ${bc.target_customers || 'Local households and community members'}.</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-title">⚠️ Risk Assessment</div>
    <table>
      <thead><tr><th>Risk Factor</th><th>Level</th><th>Mitigation Strategy</th></tr></thead>
      <tbody>
        ${risks.map(r => `
          <tr>
            <td>${r.risk}</td>
            <td class="risk-${r.level.toLowerCase()}">${r.level}</td>
            <td>${r.mitigation}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-title">📋 Document Checklist</div>
    ${[...DOCS_NEEDED.general, ...DOCS_NEEDED.scheme].map((doc, i) => `
      <div class="check-item">
        <div class="check-box">${i < 5 ? '✓' : ''}</div>
        <span>${doc}</span>
      </div>
    `).join('')}
  </div>

  <div class="card">
    <div class="card-title">✅ Action Plan — Next Steps</div>
    ${ACTION_STEPS.map((step, i) => `
      <div class="action-item">
        <div class="action-num">${i + 1}</div>
        <span>${step}</span>
      </div>
    `).join('')}
  </div>

  <div class="footer-note">
    🟢 API Data (India Post, OSM, Agmarknet) · 🔵 User Data · 🟡 Estimated by Beej AI
    &nbsp;·&nbsp; Consult a bank/field officer for final verification.
    &nbsp;·&nbsp; Generated by Agneyaa · SIH 2026
  </div>
</body>
</html>`;

    // Open in a hidden iframe and print
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    };
  };


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
