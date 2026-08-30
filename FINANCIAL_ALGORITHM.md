# Agneyaa — Financial Algorithm & Formula Reference

> This document explains every calculation used in the **Mool Financial Calculator** (Module 2) and the **Feasibility Scoring** (Module 3 / FinalReport).

---

## 1. Project Cost Estimation

The **Project Cost** is the total investment needed to start the business.

```
Default Project Cost = Own Capital / 0.10
```

This assumes the entrepreneur's own capital (equity) is approximately **10% of total project cost**, which aligns with PMEGP/MUDRA norms where banks require 10–25% margin money from the applicant.

> **Example:** Own Capital = ₹50,000 → Project Cost = ₹5,00,000

The user can override this with any custom value via the slider.

---

## 2. Gross Loan Requirement

```
Gross Loan = Project Cost − Own Capital
```

This is the total loan amount *before* applying any government subsidy.

---

## 3. Government Subsidy

```
Subsidy Amount = Gross Loan × (Subsidy % / 100)
Net Loan       = Gross Loan − Subsidy Amount
```

The default subsidy percentage is drawn from the **Government Scheme Database** (see Section 8).

> **Example:** Gross Loan = ₹4,50,000, Subsidy = 25% → Subsidy = ₹1,12,500 → Net Loan = ₹3,37,500

---

## 4. EMI Calculation — Reducing Balance Method

This is the standard **Equated Monthly Instalment (EMI)** formula used by all Indian banks:

```
EMI = P × r × (1 + r)^n
      ─────────────────────
          (1 + r)^n − 1
```

Where:
| Symbol | Meaning |
|--------|---------|
| `P` | Net Loan (principal after subsidy) |
| `r` | Monthly interest rate = Annual Rate / (100 × 12) |
| `n` | Loan tenure in months |

This is a **reducing balance** (amortisation) calculation — interest is charged only on the outstanding principal, not the original loan amount.

> **Source:** RBI standard EMI formula / Indian Banks' Association guidelines.

---

## 5. Moratorium Period

Some government schemes (NABARD, PMEGP, PMFME) offer a **moratorium** — a period at the start of the loan where no EMI is paid. Interest still accrues during this period.

```
During moratorium months:
  EMI paid     = 0
  Interest due = Balance × Monthly Rate
  New Balance  = Previous Balance + Interest (capitalised)

After moratorium:
  EMI = calcEMI(new_balance, rate, remaining_months)
```

The moratorium duration (in months) is scheme-specific (see Section 8).

---

## 6. EMI Repayment Schedule

For each month `m` in the schedule:

```
Interest Paid    = Outstanding Balance × Monthly Rate
Principal Paid   = EMI − Interest Paid
New Balance      = Old Balance − Principal Paid
```

The schedule shows the first **12 months** for clarity. Months during moratorium are flagged separately.

---

## 7. Working Capital

```
Working Capital = Net Loan × 0.10
```

Working capital (cash needed for day-to-day operations — inventory, salaries, utilities) is estimated at **10% of net loan**. This is a conservative working capital ratio aligned with NABARD's rural enterprise guidelines.

---

## 8. Government Scheme Auto-Selection

Schemes are matched by **business category** from a curated database:

| Category | Scheme | Interest Rate | Subsidy | Moratorium | Max Loan |
|----------|--------|--------------|---------|------------|----------|
| Agriculture | PMKISAN + NABARD RIDF | 7.0% | 25–35% | 6 months | Rs. 25L |
| Dairy | NABARD Dairy Entrepreneurship | 6.5% | 25–33% | 6 months | Rs. 33L |
| Retail | PMEGP (Retail) | 9.0% | 15–35% | 3 months | Rs. 25L |
| Food Processing | PMFME Scheme | 7.5% | 35% | 6 months | Rs. 10L |
| Handicraft | MUDRA — Tarun | 9.5% | 0% | 0 months | Rs. 10L |
| Tailoring | MUDRA — Kishore | 9.5% | 0% | 0 months | Rs. 5L |
| Services | PMEGP (Services) | 9.0% | 15–25% | 3 months | Rs. 10L |
| Transport | PMEGP (Manufacturing) | 9.0% | 15–35% | 3 months | Rs. 25L |
| Beauty & Wellness | MUDRA — Shishu to Kishore | 10.5% | 0% | 0 months | Rs. 5L |
| Education | PMEGP (Services) | 9.0% | 15–25% | 3 months | Rs. 10L |
| Construction | PMEGP (Manufacturing) | 9.0% | 15–35% | 3 months | Rs. 25L |
| Technology | Startup India Seed Fund | 8.0% | 0% | 6 months | Rs. 50L |

> **Sources:** PMEGP Guidelines (KVIC), PMFME Scheme (MoFPI), NABARD DEDS, MUDRA Scheme (SIDBI), Startup India (DPIIT).

---

## 9. Feasibility Score (0–10)

The feasibility score is computed as a **rule-based additive model** starting from a base of 6.0:

```
Score = 6.0 (base)

+ 1.0   if Own Capital > Rs. 2,00,000
+ 0.5   if Own Capital > Rs. 1,00,000 (exclusive of above)

+ 0.5   if Capital Ratio >= 20%
        (Capital Ratio = Own Capital / Project Cost)

+ 0.5   if category is in [agriculture, dairy, food, retail]
        (high-demand rural categories)

+ 0.5   if Caste Category is SC or ST
        (higher subsidy eligibility improves viability)

+ 0.3   if Land Ownership = 'owned'
        (reduces collateral risk)

Max cap = 9.8
```

### Score Interpretation

| Score | Verdict | Meaning |
|-------|---------|---------|
| >= 7.5 | **GO** | Strong viability, recommended to proceed |
| 5.5 – 7.4 | **CONDITIONAL GO** | Viable with mitigation of identified risks |
| < 5.5 | **NEEDS MORE STUDY** | Further research and capital planning needed |

---

## 10. Risk Matrix

Risks are pre-mapped by **business category** with three factors assessed:

- **Risk Factor** — what could go wrong
- **Level** — High / Medium / Low
- **Mitigation** — recommended counter-action

These are drawn from NABARD rural enterprise risk studies and RBI MSME lending guidelines.

---

## 11. Revenue Estimate (Indicative)

```
Monthly Revenue Lower Bound = Own Capital × 0.15 / 1000  (in Rs. K)
Monthly Revenue Upper Bound = Own Capital × 0.25 / 1000  (in Rs. K)
Achievable timeframe: 6–12 months from start
```

These are **indicative ranges** based on average rural MSME return-on-capital ratios (15%–25% monthly on equity) from NABARD NAFIS Survey 2022–23. They are labelled Estimated in all outputs.

---

## 12. Total Interest & Total Payable

```
Total Interest = (EMI × Tenure Months) − Net Loan
Total Payable  = Net Loan + max(Total Interest, 0)
```

---

## 13. Limitations & Disclaimers

All financial calculations are **estimates** based on standard banking formulas and government scheme parameters. Actual figures will vary based on:
- Final bank processing and credit assessment
- Actual subsidy disbursement timelines
- Collateral valuation
- Credit score (CIBIL) of the applicant
- Specific branch/bank policies

Always consult a **bank manager or financial advisor** before making final investment decisions.

---

## References

1. RBI — Master Circular on MSME Lending
2. KVIC — PMEGP Scheme Guidelines (2023–24)
3. MoFPI — PMFME Scheme Operational Guidelines
4. NABARD — Dairy Entrepreneurship Development Scheme (DEDS)
5. SIDBI — MUDRA Loan Scheme Documentation
6. NABARD NAFIS Survey 2022–23 (Rural Income & Financial Inclusion)
7. India Post Pincode API — Location Verification
8. Agmarknet — Commodity Price Data
9. OpenStreetMap Overpass API — Competitor/POI Mapping
