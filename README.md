# 🔥 Agneyaa — Hyper-local AI Business & Financial Advisor

> **Location + Own Money + Business Idea → AI Market Analysis + Financial Calculation → Business Feasibility Report**

Agneyaa is a hyper-local AI-powered platform built for marginalized rural entrepreneurs in India. Users enter their village, available capital, and business idea — the system performs local market analysis, calculates finances, matches the right government loan scheme, and delivers a complete feasibility report.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Directory Structure](#-directory-structure)
- [User Flow](#-user-flow)
- [Frontend](#-frontend)
- [Backend](#-backend)
- [Database](#-database)
- [Authentication](#-authentication)
- [AI Pipeline](#-ai-pipeline)
- [Environment Variables](#-environment-variables)
- [Setup & Running](#-setup--running)
- [API Reference](#-api-reference)
- [Design System](#-design-system)

---

## 🌟 Project Overview

| Feature | Description |
|---|---|
| **Local Feasibility Check** | Customers, competitors, demand, pricing, opportunities, risks |
| **Financial Calculation** | Project cost, 90% loan, EMI, interest, tenure, working capital |
| **Scheme Matching** | Auto-selects the best government loan scheme (PMEGP, MUDRA, etc.) |
| **Feasibility Report** | Final report: financially & locally suitable or not |
| **Document Support** | Required documents, post-approval steps, CSR funding |
| **Multilingual** | Supports 8 Indian languages |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework |
| CSS Modules | Component-scoped styling |
| Supabase JS SDK | Google OAuth authentication |
| Outfit / Inter (Google Fonts) | Typography |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API server |
| SQLAlchemy + PyMySQL | ORM + MySQL connector |
| Supabase (Google Auth) | Authentication provider |
| PyJWT | JWT token verification |
| Google Gemini AI | AI market analysis + feasibility |
| python-dotenv | Environment config |

### Database
| Technology | Purpose |
|---|---|
| MySQL (XAMPP) | Primary database |
| Supabase | Auth user management |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│  React + Vite  →  http://localhost:5173                     │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API calls (Bearer JWT)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                          │
│  http://localhost:8000/api/v1                               │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   auth   │  │   beej   │  │   mool   │  │  shakha  │  │
│  │ (login)  │  │(market)  │  │(finance) │  │(scheme)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                              ┌──────────┐                   │
│                              │  chhaya  │                   │
│                              │(report)  │                   │
│                              └──────────┘                   │
└──────┬──────────────────────────────────────┬──────────────┘
       │                                      │
       ▼                                      ▼
┌──────────────┐                    ┌─────────────────┐
│   MySQL DB   │                    │  Google Gemini  │
│   (XAMPP)    │                    │    AI API       │
│  agneyaa     │                    └─────────────────┘
└──────────────┘
       ▲
       │ Google OAuth
┌──────────────┐
│   Supabase   │
│ (Auth only)  │
└──────────────┘
```

---

## 📁 Directory Structure

```
AgneyaaF/
│
├── frontend/                          # React + Vite app
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top nav with Google Sign In
│   │   │   ├── Navbar.module.css
│   │   │   ├── Hero.jsx               # Landing hero section
│   │   │   ├── Hero.module.css
│   │   │   ├── Onboarding.jsx         # "How it works" section
│   │   │   ├── Onboarding.module.css
│   │   │   ├── AuthCallback.jsx       # Handles OAuth redirect + saves user to DB
│   │   │   ├── AuthCallback.module.css
│   │   │   ├── OnboardForm.jsx        # Step 1: Language + Consent
│   │   │   ├── OnboardForm.module.css
│   │   │   ├── InputForm.jsx          # Step 2: Name, Phone, Location, Business
│   │   │   └── InputForm.module.css
│   │   ├── hooks/
│   │   │   └── useAuth.js             # Supabase auth state hook
│   │   ├── lib/
│   │   │   └── supabase.js            # Supabase client + signInWithGoogle
│   │   ├── App.jsx                    # Main app state machine
│   │   ├── index.css                  # Global styles + CSS variables
│   │   └── main.jsx                   # React entry point
│   ├── index.html
│   ├── .env                           # Frontend env vars (VITE_*)
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # FastAPI app
│   ├── app/
│   │   ├── main.py                    # FastAPI app + routers + CORS
│   │   ├── database.py                # MySQL connection + session
│   │   ├── models/
│   │   │   ├── user.py                # User SQLAlchemy model
│   │   │   ├── business.py            # Business model
│   │   │   ├── scheme.py              # Government scheme model
│   │   │   ├── evidence.py            # Market evidence model
│   │   │   └── document.py            # Document checklist model
│   │   ├── routes/
│   │   │   ├── auth.py                # /auth/* — JWT verify, upsert user, profile
│   │   │   ├── beej.py                # /beej/* — Market analysis (AI)
│   │   │   ├── mool.py                # /mool/* — Financial calculation
│   │   │   ├── shakha.py              # /shakha/* — Scheme matching
│   │   │   └── chhaya.py              # /chhaya/* — Feasibility report
│   │   ├── services/
│   │   │   ├── beej_service.py        # Gemini AI market analysis logic
│   │   │   ├── mool_service.py        # Finance calculation logic
│   │   │   ├── shakha_service.py      # Scheme matching logic
│   │   │   └── chhaya_service.py      # Report generation logic
│   │   └── data/
│   │       └── seed_data.py           # Initial scheme/data seeding
│   ├── .env                           # Backend secrets (DB, Supabase, Gemini)
│   ├── .env.example                   # Template for .env
│   ├── .gitignore
│   └── requirements.txt
│
└── .git/
```

---

## 🚶 User Flow

```
1. LANDING PAGE
   └─ User sees Hero + "How it Works" + Sign In button

2. GOOGLE SIGN IN (Supabase OAuth)
   └─ Click Sign In → redirect to Google → back to /auth/callback
   └─ AuthCallback saves email + full_name to MySQL users table

3. STEP 1 — ONBOARDING (OnboardForm)
   └─ Select language (8 Indian languages)
   └─ Accept data consent
   └─ Saved via POST /api/v1/auth/profile

4. STEP 2 — BUSINESS INPUTS (InputForm)
   └─ Full Name + Mobile Number
   └─ Location: Village + Block + District
   └─ Business Idea (text description)
   └─ Available Margin Money (₹)
   └─ Business Category (12 categories)

5. AI PIPELINE (coming next)
   ├─ BEEJ  → Market Analysis (Gemini AI)
   ├─ MOOL  → Financial Calculation
   ├─ SHAKHA → Government Scheme Matching
   └─ CHHAYA → Final Feasibility Report
```

---

## 🖥 Frontend

### State Machine (`App.jsx`)
```
'landing'    → Public home page (not logged in)
'onboarding' → Step 1: Language + Consent (first login)
'inputs'     → Step 2: Business details form
'callback'   → /auth/callback route (OAuth return)
```

### Components

| Component | Role |
|---|---|
| `Navbar` | Logo + Google Sign In button / user avatar when logged in |
| `Hero` | Landing page headline and CTA |
| `Onboarding` | "How it Works" steps section |
| `AuthCallback` | Handles Supabase OAuth redirect, saves user to DB |
| `OnboardForm` | Language selector + consent checkbox |
| `InputForm` | Full business input form with validation |

### Custom Hook — `useAuth.js`
```js
const { user, session, loading } = useAuth();
// Reactively tracks Supabase session across the app
```

---

## ⚙️ Backend

### Routes

| Prefix | File | Description |
|---|---|---|
| `/api/v1/auth` | `auth.py` | JWT verify, upsert user, save profile, onboard-status |
| `/api/v1/beej` | `beej.py` | Market analysis (Gemini AI) |
| `/api/v1/mool` | `mool.py` | Financial calculation (loan, EMI, working capital) |
| `/api/v1/shakha` | `shakha.py` | Government scheme matching |
| `/api/v1/chhaya` | `chhaya.py` | Final feasibility report generation |
| `/health/db` | `main.py` | Database connection health check |

### Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/verify` | Verify Supabase JWT |
| `POST` | `/api/v1/auth/upsert-user` | Save Google user to MySQL on login |
| `POST` | `/api/v1/auth/profile` | Save language + consent |
| `GET` | `/api/v1/auth/onboard-status` | Check if user completed Step 1 |
| `GET` | `/api/v1/auth/me` | Get current user info from JWT |

---

## 🗄 Database

**MySQL via XAMPP** — Database: `agneyaa`

### `users` table
| Column | Type | Description |
|---|---|---|
| `id` | INT PK AUTO | Internal ID |
| `supabase_id` | VARCHAR UNIQUE | Supabase UUID (from JWT `sub`) |
| `email` | VARCHAR | Google email |
| `full_name` | VARCHAR | Google display name |
| `phone` | VARCHAR | Added in InputForm |
| `role` | ENUM | `user` / `admin` |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto-updates |

---

## 🔐 Authentication

**Provider:** Supabase (Google OAuth 2.0)

### Flow
```
1. User clicks "Sign In" in Navbar
2. Browser instantly redirected to:
   https://<project>.supabase.co/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173/auth/callback
3. Google shows consent screen
4. Google → Supabase callback → Supabase → http://localhost:5173/auth/callback
5. AuthCallback.jsx:
   a. Gets session from Supabase (access_token JWT)
   b. Calls POST /api/v1/auth/upsert-user (saves email + name to MySQL)
   c. Redirects to /
6. App checks /api/v1/auth/onboard-status → shows OnboardForm or InputForm
```

### JWT Verification (Backend)
- Supabase issues signed JWTs with `SUPABASE_JWT_SECRET`
- Backend uses `PyJWT` to verify every protected request
- Secret loaded via `dotenv_values(absolute_path)` to avoid parsing issues

### Required Supabase Dashboard Settings
```
Authentication → URL Configuration:
  Site URL     → http://localhost:5173
  Redirect URLs → http://localhost:5173/auth/callback

Authentication → Providers → Google:
  Enable Google → ON
  Client ID     → from Google Cloud Console
  Client Secret → from Google Cloud Console

Google Cloud Console → OAuth 2.0 Client → Authorized Redirect URIs:
  https://<your-project>.supabase.co/auth/v1/callback
```

---

## 🤖 AI Pipeline

Named after the four stages of a tree — seed → root → branch → shade:

| Stage | Name | Route | Function |
|---|---|---|---|
| 🌱 Seed | **Beej** | `/api/v1/beej` | Local market analysis — customers, competitors, demand, risks |
| 🌿 Root | **Mool** | `/api/v1/mool` | Financial calc — project cost, 90% loan, EMI, interest, tenure |
| 🌳 Branch | **Shakha** | `/api/v1/shakha` | Government scheme matching (PMEGP, MUDRA, etc.) |
| 🌤 Shade | **Chhaya** | `/api/v1/chhaya` | Final feasibility report — go/no-go decision |

---

## 🔑 Environment Variables

### `backend/.env`
```env
# MySQL (XAMPP)
DATABASE_URL=mysql+pymysql://root:@localhost:3306/agneyaa

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET="your-jwt-secret-from-supabase-settings"

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# App
ENVIRONMENT=development
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
HOST=127.0.0.1
PORT=8000
```

> ⚠️ **Wrap `SUPABASE_JWT_SECRET` in double quotes** if it contains `/` or `+` characters.

### `frontend/.env`
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🚀 Setup & Running

### Prerequisites
- Python 3.11+
- Node.js 18+
- XAMPP (MySQL running on port 3306)
- Supabase account

### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and fill environment
cp .env.example .env
# → Fill DATABASE_URL, SUPABASE_*, GEMINI_API_KEY

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy and fill environment
# Create frontend/.env and fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# Start dev server
npm run dev
```

### URLs
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| DB Health | http://localhost:8000/health/db |

---

## 🎨 Design System

### Color Palette
```css
--bg:          #0E1912   /* Deep forest black */
--bg-soft:     #122015   /* Slightly lighter background */
--surface:     #152417   /* Card surface */
--surface-2:   #1B2E1E   /* Elevated surface */

--text:        #EEEBE1   /* Primary text */
--text-muted:  #A9BAAB   /* Secondary text */

--gold:        #E0B24E   /* Primary accent (CTAs, highlights) */
--gold-strong: #F0C15C   /* Hover gold */

--leaf:        #6FBB7C   /* Success / nature green */
--danger:      #E2766A   /* Error / warning red */
--warn:        #E3A85C   /* Warning orange */
```

### Typography
- **Headings:** `Outfit` (Google Fonts) — weight 700/800
- **Body:** `Inter` (Google Fonts) — weight 400/600

### Design Principles
- Dark forest theme — nature-inspired, grounded
- Glassmorphism cards with subtle green borders
- Gold CTAs for primary actions
- Leaf green for success/navigation states
- Smooth transitions on all interactive elements

---

## 📦 Backend Dependencies

```
fastapi              REST API framework
uvicorn[standard]    ASGI server
sqlalchemy           ORM
pymysql              MySQL driver
cryptography         Crypto utilities
python-dotenv        .env file loading
pydantic             Data validation
supabase             Supabase Python client
PyJWT                JWT token verification
google-generativeai  Gemini AI SDK
httpx                Async HTTP client
python-multipart     Form data handling
```

---

## 🗺 Roadmap

- [x] Project structure & directory setup
- [x] React frontend with design system
- [x] FastAPI backend with MySQL
- [x] Supabase Google Auth integration
- [x] User onboarding flow (Step 1 + Step 2)
- [x] Auto-save user to MySQL on login
- [ ] **Beej** — AI market analysis (Gemini)
- [ ] **Mool** — Financial calculation engine
- [ ] **Shakha** — Government scheme matcher
- [ ] **Chhaya** — Feasibility report PDF
- [ ] Multilingual AI responses
- [ ] CSR funding module
- [ ] Document checklist generator
- [ ] Mobile responsive polish

---

## 👥 Team

Built for **Smart India Hackathon (SIH) 2026**

---

*Agneyaa — Igniting entrepreneurship in rural India 🔥*
