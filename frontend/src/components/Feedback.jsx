import { useState } from 'react';
import styles from './Feedback.module.css';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const SUB_ITEMS = [
  { key: 'ease',     label: 'Ease of Use' },
  { key: 'accuracy', label: 'Data Accuracy' },
  { key: 'helpful',  label: 'Beej AI Helpfulness' },
  { key: 'finance',  label: 'Financial Calculator' },
  { key: 'report',   label: 'Report Quality' },
];

const SUGGEST_CHIPS = [
  'More language options',
  'Offline mode support',
  'Voice guidance in Hindi',
  'Faster loading',
  'More scheme options',
  'WhatsApp integration',
  'Better location accuracy',
  'PDF download option',
  'Live bank officer chat',
];

/**
 * Feedback — Module 4: Rating, Feedback & Suggestions.
 *
 * Props:
 *   businessContext  — form data
 *   onSubmit         — (feedbackData) => void
 *   onBack           — () => void
 *   onGoHome         — () => void
 */
export default function Feedback({ businessContext, onSubmit, onBack, onGoHome }) {
  const bc = businessContext || {};

  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [subRatings, setSubRatings] = useState({ ease: 0, accuracy: 0, helpful: 0, finance: 0, report: 0 });
  const [feedback,  setFeedback]  = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [chips,     setChips]     = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleChip = (c) =>
    setChips(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const setSubRating = (key, val) =>
    setSubRatings(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (rating === 0) { alert('Please give an overall star rating first.'); return; }
    const data = {
      overall: rating,
      subRatings,
      feedback,
      suggestions: suggestion,
      improvementChips: chips,
      businessIdea: bc.business_idea,
      timestamp: new Date().toISOString(),
    };
    // Save to localStorage
    try {
      const all = JSON.parse(localStorage.getItem('agneyaa_feedback') || '[]');
      all.push(data);
      localStorage.setItem('agneyaa_feedback', JSON.stringify(all));
    } catch {}
    onSubmit?.(data);
    setSubmitted(true);
  };

  /* ── Thank You Screen ── */
  if (submitted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.thankYou}>
          <div className={styles.tyIcon}>🎉</div>
          <div className={styles.tyTitle}>Thank You for Your Feedback!</div>
          <div className={styles.tyDesc}>
            Your feedback on <strong>{bc.business_idea || 'your business analysis'}</strong> has been saved.
            It helps us improve Agneyaa for thousands of rural entrepreneurs across India. 🌱
          </div>
          <div style={{ fontSize: '1.5rem', letterSpacing: '0.1em' }}>
            {'⭐'.repeat(rating)}
          </div>
          <div className={styles.tyBtns}>
            <button className={`${styles.tyBtn} ${styles.secondary}`} onClick={onBack}>
              ← View Report
            </button>
            <button className={`${styles.tyBtn} ${styles.primary}`} onClick={onGoHome}>
              🏠 Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>

        {/* Header */}
        <div>
          <span className={styles.badge}>⭐ Module 4 — Feedback</span>
          <h2 className={styles.title}>Share Your Experience</h2>
          <p className={styles.subtitle}>
            Your feedback helps improve Agneyaa for rural entrepreneurs across India.
          </p>
        </div>

        {/* Overall Rating */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>⭐ Overall Rating</div>
          <div className={styles.starRow}>
            <div className={styles.stars}>
              {[1,2,3,4,5].map(n => (
                <span
                  key={n}
                  className={`${styles.star} ${n <= (hovered || rating) ? styles.filled : ''}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                >⭐</span>
              ))}
            </div>
            <span className={styles.starLabel}>
              {STAR_LABELS[hovered || rating] || 'Click to rate'}
            </span>
          </div>
        </div>

        {/* Sub-ratings per module */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>📊 Rate Each Feature</div>
          <div className={styles.subRatings}>
            {SUB_ITEMS.map(item => (
              <div key={item.key} className={styles.subRating}>
                <span className={styles.subLabel}>{item.label}</span>
                <div className={styles.miniStars}>
                  {[1,2,3,4,5].map(n => (
                    <span
                      key={n}
                      className={`${styles.miniStar} ${n <= subRatings[item.key] ? styles.filled : ''}`}
                      onClick={() => setSubRating(item.key, n)}
                    >⭐</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open feedback */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>💬 Your Feedback</div>
          <label className={styles.label}>
            Tell us what worked well or what can be improved
          </label>
          <textarea
            className={styles.textarea}
            placeholder="e.g. The Beej AI gave very helpful advice about government schemes. The financial calculator was easy to use..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={4}
          />
        </div>

        {/* Improvement chips */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>🚀 What Should We Improve?</div>
          <div className={styles.chipGroup}>
            {SUGGEST_CHIPS.map(c => (
              <button
                key={c}
                className={`${styles.chip} ${chips.includes(c) ? styles.selected : ''}`}
                onClick={() => toggleChip(c)}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>💡 Additional Suggestions</div>
          <textarea
            className={styles.textarea}
            placeholder="Any other features or improvements you'd like to see..."
            value={suggestion}
            onChange={e => setSuggestion(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit */}
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={rating === 0}
        >
          ⭐ Submit Feedback
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Back to Final Report
          </button>
        </div>

      </div>
    </div>
  );
}
