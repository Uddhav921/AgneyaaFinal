import { useState } from 'react';
import styles from './Feedback.module.css';
import { useLanguage } from '../hooks/useLanguage.jsx';

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
  const { t } = useLanguage();
  const bc = businessContext || {};

  // Build translated sub-items inside component so t() is live
  const SUB_ITEMS_T = [
    { key: 'ease',     label: t('feedback_ease') },
    { key: 'accuracy', label: t('feedback_accuracy') },
    { key: 'helpful',  label: t('feedback_helpful') },
    { key: 'finance',  label: t('feedback_finance') },
    { key: 'report',   label: t('feedback_report_quality') },
  ];

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
          <div className={styles.tyTitle}>{t('feedback_thanks_title')}</div>
          <div className={styles.tyDesc}>
            {t('feedback_thanks_msg')}
          </div>
          <div style={{ fontSize: '1.5rem', letterSpacing: '0.1em' }}>
            {'⭐'.repeat(rating)}
          </div>
          <div className={styles.tyBtns}>
            <button className={`${styles.tyBtn} ${styles.secondary}`} onClick={onBack}>
              ← View Report
            </button>
            <button className={`${styles.tyBtn} ${styles.primary}`} onClick={onGoHome}>
              {t('feedback_home_btn')}
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
          <h2 className={styles.title}>{t('feedback_title')}</h2>
          <p className={styles.subtitle}>
            Your feedback helps improve Agneyaa for rural entrepreneurs across India.
          </p>
        </div>

        {/* Overall Rating */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t('feedback_overall')}</div>
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
          <div className={styles.cardTitle}>{t('feedback_sub_ratings')}</div>
          <div className={styles.subRatings}>
            {SUB_ITEMS_T.map(item => (
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
          <div className={styles.cardTitle}>{t('feedback_written')}</div>
          <label className={styles.label}>
            {t('feedback_written_ph')}
          </label>
          <textarea
            className={styles.textarea}
            placeholder={t('feedback_written_ph')}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={4}
          />
        </div>

        {/* Improvement chips */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t('feedback_improvements')}</div>
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
          <div className={styles.cardTitle}>{t('feedback_improvements')}</div>
          <textarea
            className={styles.textarea}
            placeholder={t('feedback_suggestion_ph')}
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
          {t('feedback_submit_btn')}
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
                        {t('back')} {t('m3_title')}
          </button>
        </div>

      </div>
    </div>
  );
}
