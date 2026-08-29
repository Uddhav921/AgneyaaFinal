import { useState, useEffect, useMemo } from 'react';
import styles from './MoolCalculator.module.css';

// Government scheme database (frontend-only)
const SCHEMES = {
  agriculture:  { name: 'PMKISAN + NABARD RIDF',            rate: 7.0,  subsidy: '25–35%', moratorium: 6,  max: 2500000, tag: 'SC/ST preferred' },
  dairy:        { name: 'NABARD Dairy Entrepreneurship',     rate: 6.5,  subsidy: '25–33%', moratorium: 6,  max: 3300000, tag: 'Women priority' },
  retail:       { name: 'PMEGP (Retail)',                    rate: 9.0,  subsidy: '15–35%', moratorium: 3,  max: 2500000, tag: 'General' },
  food:         { name: 'PMFME Scheme',                      rate: 7.5,  subsidy: '35%',    moratorium: 6,  max: 1000000, tag: 'Food Processing' },
  handicraft:   { name: 'MUDRA — Tarun',                     rate: 9.5,  subsidy: '0%',     moratorium: 0,  max: 1000000, tag: 'Artisan Credit' },
  tailoring:    { name: 'MUDRA — Kishore',                   rate: 9.5,  subsidy: '0%',     moratorium: 0,  max: 500000,  tag: 'Women Entrepreneur' },
  services:     { name: 'PMEGP (Services)',                  rate: 9.0,  subsidy: '15–25%', moratorium: 3,  max: 1000000, tag: 'General' },
  transport:    { name: 'PMEGP (Manufacturing)',             rate: 9.0,  subsidy: '15–35%', moratorium: 3,  max: 2500000, tag: 'SC/ST preferred' },
  beauty:       { name: 'MUDRA — Shishu → Kishore',         rate: 10.5, subsidy: '0%',     moratorium: 0,  max: 500000,  tag: 'Women priority' },
  education:    { name: 'PMEGP (Services)',                  rate: 9.0,  subsidy: '15–25%', moratorium: 3,  max: 1000000, tag: 'General' },
  construction: { name: 'PMEGP (Manufacturing)',             rate: 9.0,  subsidy: '15–35%', moratorium: 3,  max: 2500000, tag: 'General' },
  technology:   { name: 'Startup India Seed Fund',           rate: 8.0,  subsidy: '0%',     moratorium: 6,  max: 5000000, tag: 'Innovation' },
};
const DEFAULT_SCHEME = { name: 'PMEGP', rate: 9.0, subsidy: '15–35%', moratorium: 3, max: 2500000, tag: 'General' };

function fmtINR(n) {
  if (!n && n !== 0) return '—';
  if (n >= 10_00_000) return `₹${(n/10_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n/1_000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}
function fullINR(n) { return `₹${Number(n).toLocaleString('en-IN')}`; }

function calcEMI(principal, rateAnnual, months) {
  if (!principal || !months) return 0;
  const r = rateAnnual / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1+r, months)) / (Math.pow(1+r, months) - 1);
}

function makeSchedule(principal, rateAnnual, months, moratoriumMonths = 0) {
  const rows = [];
  let balance = principal;
  const r = rateAnnual / 100 / 12;
  for (let m = 1; m <= Math.min(12, months); m++) {
    const interest = balance * r;
    if (m <= moratoriumMonths) {
      rows.push({ month: m, emi: 0, principal: 0, interest, balance, moratorium: true });
      balance += interest;
    } else {
      const emi = calcEMI(balance, rateAnnual, months - moratoriumMonths);
      const principalPaid = emi - interest;
      balance -= principalPaid;
      rows.push({ month: m, emi, principal: principalPaid, interest, balance: Math.max(0, balance), moratorium: false });
    }
  }
  return rows;
}

/**
 * MoolCalculator — Module 2: Financial Plan
 *
 * Props:
 *   businessContext  — form data
 *   onNext           — (moolData) => void
 *   onBack           — () => void
 *   onMoolData       — (data) => void — pass computed data up
 */
export default function MoolCalculator({ businessContext, onNext, onBack, onMoolData }) {
  const bc     = businessContext || {};
  const scheme = SCHEMES[bc.category] || DEFAULT_SCHEME;

  const [projectCost,  setProjectCost]  = useState(() => Math.round((Number(bc.own_capital) || 50000) / 0.1));
  const [ownCapital,   setOwnCapital]   = useState(() => Number(bc.own_capital) || 50000);
  const [tenureMonths, setTenureMonths] = useState(60);
  const [interestRate, setInterestRate] = useState(scheme.rate);
  const [subsidyPct,   setSubsidyPct]  = useState(25);

  const moolData = useMemo(() => {
    const grossLoan    = Math.max(0, projectCost - ownCapital);
    const subsidy      = grossLoan * (subsidyPct / 100);
    const netLoan      = Math.max(0, grossLoan - subsidy);
    const workingCap   = netLoan * 0.1;
    const moratorium   = scheme.moratorium;
    const emi          = calcEMI(netLoan, interestRate, tenureMonths);
    const totalInterest= emi * tenureMonths - netLoan;
    const totalPayable = netLoan + Math.max(0, totalInterest);
    const schedule     = makeSchedule(netLoan, interestRate, tenureMonths, moratorium);
    return { grossLoan, subsidy, netLoan, workingCap, emi, totalInterest, totalPayable, schedule, moratorium, projectCost, ownCapital, tenureMonths, interestRate, subsidyPct, scheme };
  }, [projectCost, ownCapital, tenureMonths, interestRate, subsidyPct, scheme]);

  useEffect(() => { onMoolData?.(moolData); }, [moolData, onMoolData]);

  const tenurePct = Math.round(((tenureMonths - 12) / (120 - 12)) * 100);

  return (
    <div className={styles.wrap}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className={styles.badge}>💰 Module 2</span>
          <h2 className={styles.title}>Mool Financial Calculator</h2>
          <p className={styles.subtitle}>
            Loan eligibility · EMI planning · Government scheme matching for{' '}
            <strong>{bc.business_idea?.slice(0,45) || 'your business'}</strong>
          </p>
        </div>
      </div>

      {/* Auto-selected Scheme */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>🏛️ Auto-Selected Government Scheme</div>
        <div className={styles.schemeCard}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span className={styles.schemeName}>{scheme.name}</span>
            <span className={styles.schemeTag}>{scheme.tag}</span>
          </div>
          <div className={styles.schemeGrid}>
            {[
              ['Interest Rate', `${scheme.rate}% p.a.`],
              ['Max Subsidy', scheme.subsidy],
              ['Max Loan', fmtINR(scheme.max)],
              ['Moratorium', `${scheme.moratorium} months`],
            ].map(([k,v]) => (
              <div className={styles.schemeField} key={k}>
                <span className={styles.schemeFieldLabel}>{k}</span>
                <span className={styles.schemeFieldVal}>{v}</span>
              </div>
            ))}
          </div>
          <div className={styles.schemeDesc}>
            Matched to category: <strong>{bc.category}</strong>.
            Caste <strong>{bc.caste_category}</strong> may qualify for higher subsidy — verify with bank.
          </div>
        </div>
      </div>

      <div className={styles.grid}>

        {/* Inputs */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>🔢 Adjust Your Numbers</div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Total Project Cost</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputPrefix}>₹</span>
              <input className={styles.input} type="number" value={projectCost}
                onChange={e => setProjectCost(Math.max(0, Number(e.target.value)))} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Own Capital Available</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputPrefix}>₹</span>
              <input className={styles.input} type="number" value={ownCapital}
                onChange={e => setOwnCapital(Math.max(0, Number(e.target.value)))} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Loan Tenure</label>
            <div className={styles.sliderRow}>
              <input className={styles.slider} type="range" min="12" max="120" step="6"
                value={tenureMonths} style={{ '--val': `${tenurePct}%` }}
                onChange={e => setTenureMonths(Number(e.target.value))} />
              <span className={styles.sliderVal}>{tenureMonths} mo.</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Interest Rate (% p.a.)</label>
            <div className={styles.sliderRow}>
              <input className={styles.slider} type="range" min="5" max="18" step="0.5"
                value={interestRate} style={{ '--val': `${((interestRate-5)/13)*100}%` }}
                onChange={e => setInterestRate(Number(e.target.value))} />
              <span className={styles.sliderVal}>{interestRate}%</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Capital Subsidy (%)</label>
            <div className={styles.sliderRow}>
              <input className={styles.slider} type="range" min="0" max="35" step="5"
                value={subsidyPct} style={{ '--val': `${(subsidyPct/35)*100}%` }}
                onChange={e => setSubsidyPct(Number(e.target.value))} />
              <span className={styles.sliderVal}>{subsidyPct}%</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>📊 Loan Breakdown</div>

          <div className={styles.resultRow}>
            {[
              { icon:'📋', label:'Project Cost',   val: fmtINR(projectCost), cls:'' },
              { icon:'🏦', label:'Gross Loan (90%)',val: fmtINR(moolData.grossLoan), cls:'blue' },
              { icon:'🎁', label:`Subsidy (${subsidyPct}%)`, val: fmtINR(moolData.subsidy), cls:'green' },
            ].map(r => (
              <div className={styles.resultItem} key={r.label}>
                <span className={styles.resultIcon}>{r.icon}</span>
                <span className={styles.resultLabel}>{r.label}</span>
                <span className={`${styles.resultValue} ${r.cls ? styles[r.cls] : ''}`}>{r.val}</span>
              </div>
            ))}
          </div>

          <div className={styles.resultRow}>
            {[
              { icon:'💳', label:'Net Loan',       val: fmtINR(moolData.netLoan),    cls:'gold'  },
              { icon:'📅', label:'Monthly EMI',    val: fmtINR(moolData.emi),         cls:'gold'  },
              { icon:'🔧', label:'Working Capital', val: fmtINR(moolData.workingCap), cls:'green' },
            ].map(r => (
              <div className={styles.resultItem} key={r.label}>
                <span className={styles.resultIcon}>{r.icon}</span>
                <span className={styles.resultLabel}>{r.label}</span>
                <span className={`${styles.resultValue} ${r.cls ? styles[r.cls] : ''}`}>{r.val}</span>
              </div>
            ))}
          </div>

          <div className={styles.resultRow} style={{ gridTemplateColumns:'1fr 1fr' }}>
            {[
              { icon:'📈', label:'Total Interest', val: fmtINR(moolData.totalInterest), cls:'' },
              { icon:'💰', label:'Total Payable',  val: fmtINR(moolData.totalPayable),  cls:'' },
            ].map(r => (
              <div className={styles.resultItem} key={r.label}>
                <span className={styles.resultIcon}>{r.icon}</span>
                <span className={styles.resultLabel}>{r.label}</span>
                <span className={styles.resultValue}>{r.val}</span>
              </div>
            ))}
          </div>

          {moolData.moratorium > 0 && (
            <div className={styles.infoNote}>
              <span>ℹ️</span>
              <span>
                <strong>{moolData.moratorium}-month moratorium</strong>: No EMI during this period.
                Interest accrues and capitalises. EMIs begin after moratorium ends.
              </span>
            </div>
          )}
        </div>

        {/* EMI Schedule - full width */}
        <div className={`${styles.card} ${styles.gridFull}`}>
          <div className={styles.cardTitle}>📅 First-Year Repayment Schedule</div>
          <div style={{ overflowX:'auto' }}>
            <table className={styles.scheduleTable}>
              <thead>
                <tr><th>Month</th><th>EMI Paid</th><th>Principal</th><th>Interest</th><th>Balance</th><th>Status</th></tr>
              </thead>
              <tbody>
                {moolData.schedule.map(row => (
                  <tr key={row.month}>
                    <td>Month {row.month}</td>
                    <td>{row.moratorium ? '—' : fullINR(Math.round(row.emi))}</td>
                    <td>{row.moratorium ? '—' : fullINR(Math.round(row.principal))}</td>
                    <td>{fullINR(Math.round(row.interest))}</td>
                    <td>{fullINR(Math.round(row.balance))}</td>
                    <td style={{ color: row.moratorium ? 'var(--warn)' : 'var(--leaf)', fontWeight:600, fontSize:'0.7rem' }}>
                      {row.moratorium ? '⏸ Moratorium' : '✓ Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.infoNote}>
            <span>ℹ️</span>
            <span>Self-calculated estimate using reducing balance method. Actual figures may vary. Consult your bank for final confirmation.</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>← Back to Beej Analysis</button>
        <span className={styles.footerNote}>💡 Adjust sliders to compare different scenarios</span>
        <button className={styles.nextBtn} onClick={() => onNext?.(moolData)}>
          View Full Report →
        </button>
      </div>

    </div>
  );
}
