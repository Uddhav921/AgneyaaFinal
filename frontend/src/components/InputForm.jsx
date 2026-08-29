import { useState, useRef, useEffect } from 'react';
import styles from './InputForm.module.css';
import PageNav from './PageNav';

const CATEGORIES = [
  { value: 'agriculture',   label: '🌾 Agriculture & Farming' },
  { value: 'retail',        label: '🏪 Retail / General Store' },
  { value: 'food',          label: '🍱 Food Processing' },
  { value: 'handicraft',    label: '🧵 Handicraft & Artisan' },
  { value: 'dairy',         label: '🐄 Dairy & Livestock' },
  { value: 'services',      label: '🔧 Local Services / Repairs' },
  { value: 'tailoring',     label: '🧶 Tailoring & Garments' },
  { value: 'transport',     label: '🚛 Transport & Logistics' },
  { value: 'beauty',        label: '💇 Beauty & Wellness' },
  { value: 'education',     label: '📚 Coaching & Education' },
  { value: 'technology',    label: '💻 Technology & Digital' },
  { value: 'construction',  label: '🏗️ Construction & Hardware' },
];

const CASTE_CATEGORIES = [
  { value: 'sc',        label: 'SC — Scheduled Caste' },
  { value: 'st',        label: 'ST — Scheduled Tribe' },
  { value: 'obc',       label: 'OBC — Other Backward Class' },
  { value: 'nt',        label: 'NT — Nomadic Tribe' },
  { value: 'sbc',       label: 'SBC — Special Backward Class' },
  { value: 'open',      label: 'Open / General' },
  { value: 'minority',  label: 'Minority' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

const LAND_OPTIONS = [
  { value: 'owned',   label: '🏡 Own Land' },
  { value: 'rented',  label: '🤝 Rented / Leased' },
  { value: 'none',    label: '🚫 No Land' },
];

/**
 * InputForm — Step 2.
 * Collects: full_name, phone, village, block, district, business idea, own capital, category.
 */
/**
 * InputForm — Step 2b (text mode).
 * Collects: full_name, phone, village, block, district, business idea,
 * own capital, category, caste_category, land_owned, target_customers.
 * Accepts initialData to pre-populate fields from voice transcript.
 */
export default function InputForm({ onSubmit, loading, initialData = {}, onBack, onFormChange }) {
  const formRef = useRef(null);
  const [form, setForm] = useState({
    full_name:        initialData.full_name        || '',
    phone:            initialData.phone            || '',
    village:          initialData.village          || '',
    block:            initialData.block            || '',
    district:         initialData.district         || '',
    business_idea:    initialData.business_idea    || '',
    own_capital:      initialData.own_capital      || '',
    category:         initialData.category         || '',
    caste_category:   initialData.caste_category   || '',
    land_owned:       initialData.land_owned       || '',
    target_customers: initialData.target_customers || '',
  });
  const [errors, setErrors] = useState({});

  // Persist form data to localStorage as user types
  useEffect(() => {
    onFormChange?.(form);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);


  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())           e.full_name        = 'Full name is required';
    if (!form.phone.trim())               e.phone            = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
                                          e.phone            = 'Enter a valid 10-digit Indian mobile number';
    if (!form.village.trim())             e.village          = 'Village is required';
    if (!form.block.trim())               e.block            = 'Block is required';
    if (!form.district.trim())            e.district         = 'District is required';
    if (!form.business_idea.trim())       e.business_idea    = 'Describe your business idea';
    if (!form.own_capital || Number(form.own_capital) <= 0)
                                          e.own_capital      = 'Enter a valid amount';
    if (!form.category)                   e.category         = 'Select a business category';
    if (!form.caste_category)             e.caste_category   = 'Select your caste category';
    if (!form.land_owned)                 e.land_owned       = 'Select land ownership';
    if (!form.target_customers.trim())    e.target_customers = 'Describe your target customers';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const handleForward = () => formRef.current?.requestSubmit();

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <PageNav
          onBack={onBack}
          onForward={handleForward}
          forwardLabel="Analyse"
          forwardDisabled={loading}
        />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.icon}>📍</span>
          <h2>Tell us about your business</h2>
          <p>We'll analyse local demand, calculate finances & match you to the right scheme.</p>
        </div>

        {/* Step indicator */}
        <div className={styles.steps}>
          <div className={styles.step}>
            <span>✓</span> Profile
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${styles.active}`}>
            <span>2</span> Your Business
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>

          {/* ── Personal Details ── */}
          <div className={styles.sectionLabel}>👤 Personal Details</div>
          <div className={styles.row2}>

            {/* Full Name */}
            <div className={styles.field}>
              <input
                className={`${styles.input} ${errors.full_name ? styles.inputErr : ''}`}
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
              />
              {errors.full_name && <span className={styles.errMsg}>{errors.full_name}</span>}
            </div>

            {/* Mobile Number */}
            <div className={styles.field}>
              <div className={styles.inputPrefix}>
                <span className={styles.prefix}>+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  className={`${styles.input} ${styles.inputWithPrefix91} ${errors.phone ? styles.inputErr : ''}`}
                  placeholder="Mobile Number"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                />
              </div>
              {errors.phone && <span className={styles.errMsg}>{errors.phone}</span>}
            </div>

          </div>

          {/* ── Location ── */}
          <div className={styles.sectionLabel}>📍 Location</div>
          <div className={styles.row3}>
            {[
              { key: 'village',  placeholder: 'Village name' },
              { key: 'block',    placeholder: 'Block / Tehsil' },
              { key: 'district', placeholder: 'District' },
            ].map(({ key, placeholder }) => (
              <div key={key} className={styles.field}>
                <input
                  className={`${styles.input} ${errors[key] ? styles.inputErr : ''}`}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
                {errors[key] && <span className={styles.errMsg}>{errors[key]}</span>}
              </div>
            ))}
          </div>

          {/* ── Business Idea ── */}
          <div className={styles.field}>
            <div className={styles.sectionLabel}>💡 Business Idea</div>
            <textarea
              className={`${styles.textarea} ${errors.business_idea ? styles.inputErr : ''}`}
              placeholder="Describe your business idea in 1-2 sentences… e.g. 'I want to start a small grocery store selling daily essentials in my village'"
              rows={3}
              value={form.business_idea}
              onChange={(e) => set('business_idea', e.target.value)}
            />
            {errors.business_idea && <span className={styles.errMsg}>{errors.business_idea}</span>}
          </div>

          {/* ── Capital ── */}
          <div className={styles.field}>
            <div className={styles.sectionLabel}>💰 Available Margin Money (₹)</div>
            <div className={styles.inputPrefix}>
              <span className={styles.prefix}>₹</span>
              <input
                type="number"
                min="0"
                className={`${styles.input} ${styles.inputWithPrefix} ${errors.own_capital ? styles.inputErr : ''}`}
                placeholder="e.g. 50000"
                value={form.own_capital}
                onChange={(e) => set('own_capital', e.target.value)}
              />
            </div>
            {errors.own_capital && <span className={styles.errMsg}>{errors.own_capital}</span>}
          </div>

          {/* ── Business Category ── */}
          <div className={styles.field}>
            <div className={styles.sectionLabel}>🏪 Business Category</div>
            <div className={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`${styles.catBtn} ${form.category === cat.value ? styles.selected : ''}`}
                  onClick={() => set('category', cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {errors.category && <span className={styles.errMsg}>{errors.category}</span>}
          </div>

          {/* ── Caste Category ── */}
          <div className={styles.field}>
            <div className={styles.sectionLabel}>🪪 Caste / Social Category</div>
            <div className={styles.casteGrid}>
              {CASTE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.casteBtn} ${form.caste_category === c.value ? styles.casteSelected : ''}`}
                  onClick={() => set('caste_category', c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {errors.caste_category && <span className={styles.errMsg}>{errors.caste_category}</span>}
          </div>

          {/* ── Land Ownership ── */}
          <div className={styles.field}>
            <div className={styles.sectionLabel}>🌍 Land Ownership</div>
            <div className={styles.landRow}>
              {LAND_OPTIONS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  className={`${styles.landBtn} ${form.land_owned === l.value ? styles.landSelected : ''}`}
                  onClick={() => set('land_owned', l.value)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {errors.land_owned && <span className={styles.errMsg}>{errors.land_owned}</span>}
          </div>

          {/* ── Target Customers ── */}
          <div className={styles.field}>
            <div className={styles.sectionLabel}>🎯 Target Customers</div>
            <input
              className={`${styles.input} ${errors.target_customers ? styles.inputErr : ''}`}
              placeholder="e.g. Women in nearby villages, local farmers, school children…"
              value={form.target_customers}
              onChange={(e) => set('target_customers', e.target.value)}
            />
            {errors.target_customers && <span className={styles.errMsg}>{errors.target_customers}</span>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} /> Analysing…</>
            ) : (
              '🔥 Analyse My Business'
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
