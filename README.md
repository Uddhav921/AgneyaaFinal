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
| Custom Auth | Google OAuth authentication |
| Outfit / Inter (Google Fonts) | Typography |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API server |
| SQLAlchemy + PyMySQL | ORM + MySQL connector |
| Custom Google Auth | Authentication provider |
| PyJWT | JWT token verification |
| Google Gemini AI | AI market analysis + feasibility |
| python-dotenv | Environment config |

### Database
| Technology | Purpose |
|---|---|
| MySQL (XAMPP) | Primary database |

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
│Google Server │
│ (OAuth 2.0)  │
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
│   │   │   ├── InputMethodSelect.jsx  # Select Text or Voice Input
│   │   │   ├── InputMethodSelect.module.css
│   │   │   ├── VoiceRecorder.jsx      # Voice input component
│   │   │   ├── VoiceRecorder.module.css
│   │   │   ├── InputForm.jsx          # Step 2: Name, Phone, Location, Business
│   │   │   ├── InputForm.module.css
│   │   │   ├── BeejChat.jsx           # Conversational AI interface
│   │   │   └── BeejChat.module.css
│   │   ├── hooks/
│   │   │   ├── useAuth.js             # Auth state hook
│   │   │   └── useSessionStore.js     # Chat session local storage hook
│   │   ├── lib/
│   │   │   └── auth.js                # Custom auth helpers
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
│   │   │   ├── auth.py                # /auth/* — Custom Google OAuth, JWT verify
│   │   │   ├── beej.py                # /beej/* — Market analysis (AI Chat/SSE)
│   │   │   ├── mool.py                # /mool/* — Financial calculation
│   │   │   ├── shakha.py              # /shakha/* — Scheme matching
│   │   │   └── chhaya.py              # /chhaya/* — Feasibility report
│   │   ├── services/
│   │   │   ├── beej_service.py        # Gemini AI market analysis + Data APIs
│   │   │   ├── mool_service.py        # Finance calculation logic
│   │   │   ├── shakha_service.py      # Scheme matching logic
│   │   │   └── chhaya_service.py      # Report generation logic
│   │   └── data/
│   │       └── seed_data.py           # Initial scheme/data seeding
│   ├── .env                           # Backend secrets (DB, Google, Gemini)
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

2. GOOGLE SIGN IN (Custom OAuth)
   └─ Click Sign In → redirect to backend → Google → back to /auth/callback
   └─ Backend issues JWT, frontend AuthCallback saves to localStorage

3. STEP 1 — ONBOARDING (OnboardForm)
   └─ Select language (8 Indian languages)
   └─ Accept data consent
   └─ Saved via POST /api/v1/auth/profile

4. STEP 2 — BUSINESS INPUTS
   ├─ InputMethodSelect: Choose Voice or Text
   ├─ VoiceRecorder (Optional): Transcribe idea
   └─ InputForm: Name, Phone, Location, Business Idea, Margin Money, Category

5. AI PIPELINE
   ├─ BEEJ  → Interactive conversational market analysis (Gemini AI + Live Data)
   ├─ MOOL  → Financial Calculation
   ├─ SHAKHA → Government Scheme Matching
   └─ CHHAYA → Final Feasibility Report Generation
```

---

## 🖥 Frontend

### State Machine (`App.jsx`)
```
'landing'      → Public home page (not logged in)
'onboarding'   → Step 1: Language + Consent (first login)
'inputMethod'  → Step 2: Choose Text or Voice input
'voiceInput'   → Step 2: Voice recording page
'inputs'       → Step 2: Business details form (pre-filled if voice used)
'chat'         → Step 3: Beej conversational AI chat
'callback'     → /auth/callback route (OAuth return)
```

### Components

| Component | Role |
|---|---|
| `Navbar` | Logo + Google Sign In button / user avatar when logged in |
| `Hero` | Landing page headline and CTA |
| `Onboarding` | "How it Works" steps section |
| `AuthCallback` | Handles custom OAuth redirect, saves token |
| `OnboardForm` | Language selector + consent checkbox |
| `InputMethodSelect` | Choose Text or Voice input method |
| `VoiceRecorder` | Voice input for business idea transcription |
| `InputForm` | Full business input form with validation |
| `BeejChat` | Streaming conversational UI with AI |

### Custom Hooks
- `useAuth.js`: Tracks custom JWT auth state across the app.
- `useSessionStore.js`: LocalStorage-backed session management for chats.

---

## ⚙️ Backend

### Routes

| Prefix | File | Description |
|---|---|---|
| `/api/v1/auth` | `auth.py` | Google OAuth, JWT issuance, save profile, onboard-status |
| `/api/v1/beej` | `beej.py` | Conversational market analysis (Gemini AI + Streaming) |
| `/api/v1/mool` | `mool.py` | Financial calculation (loan, EMI, working capital) |
| `/api/v1/shakha` | `shakha.py` | Government scheme matching |
| `/api/v1/chhaya` | `chhaya.py` | Final feasibility report generation |
| `/health/db` | `main.py` | Database connection health check |

### Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/auth/google/login` | Redirect to Google OAuth consent |
| `GET` | `/api/v1/auth/google/callback`| Handle Google callback & issue JWT |
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
| `google_id` | VARCHAR UNIQUE | Google UUID (from Google UserInfo) |
| `email` | VARCHAR | Google email |
| `name` | VARCHAR | Google display name |
| `avatar_url` | VARCHAR | Google profile picture URL |
| `phone` | VARCHAR | Added in InputForm |
| `language` | VARCHAR | Preferred language |
| `consent` | BOOLEAN | Data consent flag |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto-updates |

---

## 🔐 Authentication

**Provider:** Custom Google OAuth 2.0 (No third-party SDKs)

### Flow
```
1. User clicks "Sign In" in Navbar
2. Frontend calls signInWithGoogle() → redirects to /api/v1/auth/google/login
3. Backend redirects to Google OAuth consent screen
4. Google → backend /api/v1/auth/google/callback
5. Backend:
   a. Exchanges code for Google access token
   b. Fetches user profile from Google API
   c. Issues our own custom JWT signed with SECRET_KEY
   d. Redirects to http://localhost:5173/auth/callback#token=<JWT>
6. AuthCallback.jsx extracts token, saves to localStorage.
7. App checks /api/v1/auth/onboard-status → shows OnboardForm or InputForm
```

### JWT Verification (Backend)
- Backend issues and verifies JWTs using `PyJWT` and a `SECRET_KEY`.
- No reliance on external BaaS (like Supabase) for authentication logic.

---

## 🤖 AI Pipeline

Named after the four stages of a tree — seed → root → branch → shade:

| Stage | Name | Route | Function |
|---|---|---|---|
| 🌱 Seed | **Beej** | `/api/v1/beej` | Conversational local market analysis (Gemini) + Dataset API fetches |
| 🌿 Root | **Mool** | `/api/v1/mool` | Financial calc — project cost, 90% loan, EMI, interest, tenure |
| 🌳 Branch | **Shakha** | `/api/v1/shakha` | Government scheme matching (PMEGP, MUDRA, etc.) |
| 🌤 Shade | **Chhaya** | `/api/v1/chhaya` | Final feasibility report & CSR funding matching |

---

## 🔑 Environment Variables

### `backend/.env`
```env
# MySQL (XAMPP)
DATABASE_URL=mysql+pymysql://root:@localhost:3306/agneyaa

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Keys
GEMINI_API_KEY=your-gemini-api-key
DATA_GOV_API_KEY=your-data-gov-api-key

# App config
ENVIRONMENT=development
SECRET_KEY=your-random-jwt-secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🚀 Setup & Running

### Prerequisites
- Python 3.11+
- Node.js 18+
- XAMPP (MySQL running on port 3306)

### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and fill environment
cp .env.example .env
# → Fill DATABASE_URL, GOOGLE_*, GEMINI_API_KEY, DATA_GOV_API_KEY

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

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
PyJWT                JWT token verification
requests             HTTP requests for OAuth
google-generativeai  Gemini AI SDK
httpx                Async HTTP client
python-multipart     Form data handling
```

---

## 🗺 Roadmap

- [x] Project structure & directory setup
- [x] React frontend with design system
- [x] FastAPI backend with MySQL
- [x] Custom Google Auth integration (JWT)
- [x] User onboarding flow (Step 1 + Step 2)
- [x] Auto-save user to MySQL on login
- [x] **Beej** — AI market analysis chat (Gemini)
- [x] **Mool** — Financial calculation engine
- [x] **Shakha** — Government scheme matcher
- [x] **Chhaya** — Feasibility report generation
- [ ] Multilingual AI responses
- [ ] Document checklist generator
- [ ] Mobile responsive polish

---

## 👥 Team

Built for **Smart India Hackathon (SIH) 2026**

---

*Agneyaa — Igniting entrepreneurship in rural India 🔥*
