# RFP Proposal AI - Technical Overview

## 1. Introduction

**RFP Proposal AI** is a full-stack web application that helps businesses generate winning proposals for Requests for Proposals (RFPs). It leverages Google Gemini AI to parse RFP documents, analyze scoring criteria, assess competitors, and produce comprehensive, data-driven bid proposals with financial modeling and scoring optimization.

### Key Capabilities
- Upload and AI-parse RFP documents (PDF/TXT)
- Extract and analyze scoring criteria with AI strategies
- Manage competitors and predict their bidding strategies
- Generate complete proposals (15+ sections) with a single click
- Financial modeling: Minimum Annual Guarantee + Revenue Share + Escalation
- Year-wise financial projections and scoring breakdown
- Export proposals as professionally formatted PDF documents
- Track historical bids to improve future proposals

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              FRONTEND — React 19 + Vite + TypeScript          │
│  Dashboard │ RFP Upload │ Proposal Generator │ Competitors    │
│  Zustand (state) │ Axios (HTTP) │ Tailwind CSS │ Recharts     │
└────────────────────────┬─────────────────────────────────────┘
                         │  REST API (proxied via Vite :5180 → :3001)
┌────────────────────────┴─────────────────────────────────────┐
│              BACKEND — Node.js + Express + TypeScript          │
│  JWT Auth │ 4 AI Pipelines │ PDF Generator │ File Upload      │
│                   ┌───────────────┐                           │
│                   │ Google Gemini  │  gemini-2.0-flash         │
│                   └───────────────┘                           │
└────────────────────────┬─────────────────────────────────────┘
                         │  Prisma ORM
┌────────────────────────┴─────────────────────────────────────┐
│              DATABASE — PostgreSQL                             │
│  Users │ RFPs │ Scoring Criteria │ Competitors │ Proposals     │
│  Historical Bids │ RFP-Competitor Links                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Runtime** | Node.js + TypeScript | Server-side execution |
| **Web Framework** | Express 4.21 | REST API routing, middleware |
| **Database** | PostgreSQL | Persistent data storage |
| **ORM** | Prisma 6.4 | Type-safe database access, migrations |
| **AI** | Google Gemini 2.0 Flash | RFP parsing, scoring analysis, competitor analysis, proposal generation |
| **Auth** | JWT + bcrypt | Token-based authentication, password hashing |
| **Validation** | Zod | Schema validation for AI outputs and API inputs |
| **File Upload** | Multer | Multipart file handling (PDF, TXT, DOC) |
| **PDF Parsing** | pdf-parse | Extract text from uploaded PDFs |
| **PDF Generation** | PDFKit | Generate professional proposal PDFs |
| **Frontend** | React 19 + TypeScript | User interface |
| **Build Tool** | Vite 6.1 | Frontend dev server and bundler |
| **State Management** | Zustand 5 | Lightweight client-side state |
| **HTTP Client** | Axios | API communication |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS framework |
| **Charts** | Recharts | Dashboard visualizations |
| **Icons** | Lucide React | UI iconography |
| **File Upload UI** | React Dropzone | Drag-and-drop file uploads |

---

## 4. Project Structure

```
PoC_RFP/
├── server/
│   ├── src/
│   │   ├── index.ts                          # Entry point
│   │   ├── app.ts                            # Express setup, middleware, routes
│   │   ├── config/
│   │   │   ├── environment.ts                # Env validation (Zod)
│   │   │   ├── claude.ts                     # Gemini AI client init
│   │   │   └── database.ts                   # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── auth.ts                       # JWT verification
│   │   │   ├── upload.ts                     # Multer config (50MB, PDF/TXT/DOC)
│   │   │   └── errorHandler.ts               # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── rfp.routes.ts
│   │   │   ├── proposal.routes.ts
│   │   │   ├── competitor.routes.ts
│   │   │   ├── competitorRfp.routes.ts
│   │   │   ├── historical.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── rfp.controller.ts
│   │   │   ├── proposal.controller.ts        # Includes PDF export
│   │   │   ├── competitor.controller.ts
│   │   │   ├── historical.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── rfp.service.ts
│   │   │   ├── proposal.service.ts
│   │   │   ├── competitor.service.ts
│   │   │   ├── historical.service.ts
│   │   │   └── ai/                           # ★ AI Pipelines
│   │   │       ├── claude.service.ts         # Gemini SDK wrapper
│   │   │       ├── rfpParser.ai.ts           # Pipeline 1: Parse RFP documents
│   │   │       ├── scoringAnalyzer.ai.ts     # Pipeline 2: Scoring strategies
│   │   │       ├── competitorAnalyzer.ai.ts  # Pipeline 3: Competitor analysis
│   │   │       └── proposalGenerator.ai.ts   # Pipeline 4: Full proposal generation
│   │   ├── utils/
│   │   │   ├── pdfParser.ts                  # Extract text from PDF files
│   │   │   ├── pdfGenerator.ts               # Generate proposal PDFs
│   │   │   └── params.ts                     # Express 5 param helper
│   │   └── types/
│   │       ├── rfp.types.ts                  # Zod schemas (ParsedRfp, ProposalOutput)
│   │       ├── pdfkit.d.ts                   # PDFKit type declarations
│   │       └── pdf-parse.d.ts                # pdf-parse type declarations
│   ├── prisma/
│   │   ├── schema.prisma                     # Database schema
│   │   └── seed.ts                           # Demo data (3 users, 7 competitors, 20+ bids, 3 RFPs)
│   ├── uploads/                              # Uploaded RFP files
│   └── package.json
├── client/
│   ├── src/
│   │   ├── main.tsx                          # React entry
│   │   ├── App.tsx                           # Router + protected routes
│   │   ├── api/
│   │   │   ├── client.ts                     # Axios instance + interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── rfp.api.ts
│   │   │   ├── proposal.api.ts
│   │   │   ├── competitor.api.ts
│   │   │   └── historical.api.ts
│   │   ├── store/
│   │   │   ├── authStore.ts                  # Auth state (Zustand)
│   │   │   └── rfpStore.ts                   # RFP state (Zustand)
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx                 # Login/Register
│   │   │   ├── DashboardPage.tsx             # Stats + pipeline charts
│   │   │   ├── RfpListPage.tsx               # RFP listing
│   │   │   ├── NewRfpPage.tsx                # Upload + auto-parse
│   │   │   ├── RfpDetailPage.tsx             # RFP details + AI actions
│   │   │   ├── ProposalPage.tsx              # 4-tab proposal viewer/editor
│   │   │   ├── CompetitorsPage.tsx           # Competitor CRUD
│   │   │   └── HistoricalDataPage.tsx        # Historical bids CRUD
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   └── common/
│   │   │       └── LoadingSpinner.tsx
│   │   └── types/
│   │       └── index.ts                      # Frontend type definitions
│   ├── vite.config.ts                        # Dev server + API proxy
│   └── package.json
├── demo/
│   ├── run_demo.py                           # Automated video demo generator
│   └── output/                               # Generated demo video + assets
├── sample-rfps/
│   └── airport-rfp-sample.txt                # Sample RFP for testing
├── reference/
│   └── architecture.md                       # Architecture documentation
└── package.json                              # Root workspace config
```

---

## 5. Database Schema

### Entity Relationship

```
User ─┬─< Rfp ──┬──< ScoringCriteria
      │         ├──< RfpCompetitor >── Competitor ──< HistoricalBid
      │         └──< Proposal
      └─────────────< Proposal (createdBy)
```

### Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **users** | id, email, passwordHash, name, role | Authentication & ownership |
| **rfps** | id, title, clientName, industry, status, projectScope, estimatedValue, rawText | RFP documents |
| **scoring_criteria** | rfpId, criterionName, maxPoints, weightPct, aiStrategy | Scoring criteria per RFP |
| **competitors** | id, name, industries[], strengths, weaknesses, typicalBidStyle | Competitor profiles |
| **rfp_competitors** | rfpId, competitorId, expectedStrategy, threatLevel | AI-analyzed competitor links |
| **historical_bids** | rfpTitle, industry, flatGuarantee, profitSharePct, outcome, lessonsLearned | Past bid records |
| **proposals** | rfpId, version, status, 15 text sections, financial fields, yearWiseProjections (JSON), scoringBreakdown (JSON), predictedScore | Generated proposals |

### RFP Status Flow
```
draft → parsing → analyzed → proposal_draft → submitted → won/lost
```

---

## 6. The Four AI Pipelines

All AI pipelines use Google Gemini 2.0 Flash via a shared wrapper (`claude.service.ts`) that handles:
- System prompt + user message construction
- JSON extraction from markdown code blocks
- Zod schema validation of AI outputs

### Pipeline 1: RFP Document Parser
**File**: `server/src/services/ai/rfpParser.ai.ts`

**Trigger**: User uploads PDF → clicks "Parse with AI"

**Input**: Raw text extracted from PDF via pdf-parse

**Output** (Zod validated):
- title, client_name, industry, project_scope
- submission_deadline, contract_duration, estimated_value, location
- scoring_criteria[] — {name, max_points, weight_pct, description}

**Flow**: Upload PDF → extract text → Gemini parses structured fields → save to DB → status="analyzed"

---

### Pipeline 2: Scoring Criteria Analyzer
**File**: `server/src/services/ai/scoringAnalyzer.ai.ts`

**Trigger**: User clicks "Analyze Scoring" on RFP detail page

**Input**: Scoring criteria + top 10 historical winning bids (same industry)

**Output** (Zod validated):
- Per-criterion strategies with actionable advice
- Priority ranking (high/medium/low)
- Estimated achievable points per criterion

**Flow**: Fetch criteria + historical winners → Gemini analyzes → save strategies to ScoringCriteria.aiStrategy

---

### Pipeline 3: Competitor Analyzer
**File**: `server/src/services/ai/competitorAnalyzer.ai.ts`

**Trigger**: User links competitors to an RFP

**Input**: RFP details + competitor profiles + their historical bids

**Output** (Zod validated):
- predicted_strategy per competitor
- threat_level (high/medium/low)
- our_differentiation_opportunity

**Flow**: Fetch competitor data + bids → Gemini analyzes → save to RfpCompetitor table

---

### Pipeline 4: Proposal Generator (Core)
**File**: `server/src/services/ai/proposalGenerator.ai.ts`

**Trigger**: User clicks "Generate Proposal"

**Input** (ProposalContext):
- RFP details (title, client, industry, scope, value, duration)
- Scoring criteria with AI strategies
- Competitor analysis (strategies, threat levels)
- Historical winning bids (similar industry/client)

**Output** (Zod validated — ProposalOutput):

| Category | Fields |
|----------|--------|
| **Sections** | executive_summary, company_overview, experience_section, approach_section, project_timeline, team_structure, revenue_proposal, cost_overview, risk_mitigation, value_proposition, compliance_statement, competitive_advantages, terms_and_conditions |
| **Financial** | recommended_flat_guarantee, recommended_profit_share, annual_escalation_pct |
| **Projections** | year_wise_projections[] — {year, guaranteed_amount, projected_revenue, profit_share_amount, total_to_client} |
| **Scoring** | scoring_breakdown[] — {criterion, max_points, estimated_points, justification} |
| **Meta** | predicted_score (0-100), optimization_notes |

**Flow**: Assemble full context → Gemini generates comprehensive proposal → Zod validate → save all fields to Proposal table → update RFP status="proposal_draft"

---

## 7. PDF Generation System

**File**: `server/src/utils/pdfGenerator.ts`

Uses PDFKit to produce a professional proposal document:

| Section | Description |
|---------|-------------|
| **Cover Page** | Dark background, RFP title, client name, version, date, financial highlights, predicted score, confidential watermark |
| **Table of Contents** | All 15 numbered sections |
| **1–6** | Executive Summary, Company Overview, Experience, Approach, Timeline, Team Structure |
| **7** | Financial Proposal with revenue model summary (MAG, revenue share %, escalation %) |
| **8** | Cost Overview |
| **9** | Year-Wise Projections Table (with formatted currency and totals row) |
| **10** | Scoring Breakdown (criterion, estimated/max points, justification) |
| **11–15** | Risk Mitigation, Value Proposition, Competitive Advantages, Compliance, Terms & Conditions |
| **Footer** | Page numbers + confidential notice on every page |

**Endpoint**: `GET /api/rfps/:id/proposals/:pid/pdf`
- `?inline=1` — displays in browser
- Default — downloads as attachment

---

## 8. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Returns JWT token (7-day expiry) |
| GET | `/api/auth/me` | Current user profile |

### RFP Management (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rfps` | Upload RFP (multipart/form-data) |
| GET | `/api/rfps` | List all RFPs |
| GET | `/api/rfps/:id` | RFP detail with relations |
| PATCH | `/api/rfps/:id` | Update RFP fields |
| DELETE | `/api/rfps/:id` | Delete RFP (cascades) |
| POST | `/api/rfps/:id/parse` | Trigger AI parsing |
| POST | `/api/rfps/:id/analyze-scoring` | Trigger scoring analysis |

### Proposals (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rfps/:id/proposals` | Generate proposal (AI) |
| GET | `/api/rfps/:id/proposals` | List all versions |
| GET | `/api/rfps/:id/proposals/:pid` | Get proposal |
| PATCH | `/api/rfps/:id/proposals/:pid` | Update proposal sections |
| GET | `/api/rfps/:id/proposals/:pid/pdf` | Export as PDF |

### Competitors (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PATCH/DELETE | `/api/competitors[/:id]` | CRUD operations |
| POST | `/api/rfps/:id/competitors` | Link + AI analysis |
| GET | `/api/rfps/:id/competitors` | Get linked competitors |

### Historical Bids (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PATCH/DELETE | `/api/historical-bids[/:id]` | CRUD operations |
| GET | `/api/historical-bids/similar/:rfpId` | AI-matched similar bids |

### Dashboard (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Win rate, totals, active count |
| GET | `/api/dashboard/pipeline` | RFPs grouped by status |

---

## 9. Frontend Architecture

### Routing
| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Login/register (public) |
| `/` | DashboardPage | Stats cards + pipeline charts |
| `/rfps` | RfpListPage | All RFPs with status badges |
| `/rfps/new` | NewRfpPage | Drag-drop upload + auto-parse |
| `/rfps/:id` | RfpDetailPage | RFP detail + AI actions (parse, analyze, generate) |
| `/rfps/:id/proposals/:pid` | ProposalPage | 4-tab proposal viewer/editor |
| `/competitors` | CompetitorsPage | Competitor CRUD |
| `/historical` | HistoricalDataPage | Historical bids CRUD |

### State Management (Zustand)

**authStore**: user, token, login(), register(), logout(), loadUser() — persists token to localStorage

**rfpStore**: rfps[], currentRfp, loading, fetchRfps(), fetchRfp(), uploadRfp(), parseRfp()

### API Layer (Axios)
- Base URL: `/api` (proxied by Vite to localhost:3001)
- Request interceptor: attaches Bearer token from localStorage
- Response interceptor: redirects to /login on 401

### ProposalPage Tabs
| Tab | Content |
|-----|---------|
| **Overview** | Revenue model cards (MAG, share %, escalation, predicted score), rationale, section checklist |
| **Proposal Sections** | All 13 sections as editable textareas |
| **Financial Projections** | Year-by-year table with totals |
| **Scoring Strategy** | Per-criterion progress bars with justifications |

---

## 10. End-to-End Data Flow

```
                                 ┌─────────────┐
                                 │  User drops  │
                                 │  PDF file    │
                                 └──────┬───────┘
                                        │
                               POST /api/rfps (multipart)
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  Store file in       │
                              │  uploads/ directory   │
                              │  Create Rfp (draft)   │
                              └──────────┬────────────┘
                                         │
                              POST /api/rfps/:id/parse
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │  pdf-parse extracts text from PDF       │
                    │  ↓                                      │
                    │  Gemini AI Pipeline 1: Parse RFP        │
                    │  ↓                                      │
                    │  Save structured data + scoring criteria│
                    │  Update status → "analyzed"             │
                    └────────────────────┬───────────────────┘
                                         │
                         ┌───────────────┼───────────────┐
                         │               │               │
                  Analyze Scoring    Link Competitors   (both optional)
                         │               │
                         ▼               ▼
               ┌──────────────┐  ┌──────────────────┐
               │ Pipeline 2:  │  │ Pipeline 3:       │
               │ Score each   │  │ Predict competitor│
               │ criterion    │  │ strategies +      │
               │ + strategies │  │ threat levels     │
               └──────┬───────┘  └────────┬──────────┘
                      │                   │
                      └───────┬───────────┘
                              │
                    POST /api/rfps/:id/proposals
                              │
                              ▼
               ┌──────────────────────────────────┐
               │  Pipeline 4: Generate Proposal     │
               │  Context = RFP + Criteria +        │
               │  Competitors + Historical Winners   │
               │  ↓                                  │
               │  Gemini generates 15 sections +     │
               │  financial model + projections +    │
               │  scoring breakdown                  │
               │  ↓                                  │
               │  Zod validation → Save to DB        │
               └──────────────────┬─────────────────┘
                                  │
                                  ▼
               ┌──────────────────────────────────┐
               │  ProposalPage (4 tabs)            │
               │  User reviews, edits, refines     │
               │  ↓                                │
               │  Download PDF → Client-ready doc  │
               └──────────────────────────────────┘
```

---

## 11. Security

| Concern | Implementation |
|---------|---------------|
| **Authentication** | JWT tokens (7-day expiry) in Authorization header |
| **Password Storage** | bcrypt with salt rounds = 10 |
| **Route Protection** | authMiddleware on all sensitive endpoints |
| **Rate Limiting** | 500 requests / 15 minutes per IP |
| **File Upload** | Whitelist (.pdf, .doc, .docx, .txt, .eml), 50MB max |
| **Input Validation** | Zod schemas for AI outputs and API inputs |
| **CORS** | Enabled for frontend-backend communication |

---

## 12. Environment Configuration

### Server (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/rfp_proposal_ai
JWT_SECRET=your-secret-key-min-10-chars
GEMINI_API_KEY=your-google-gemini-api-key
PORT=3001
NODE_ENV=development
```

### Client (vite.config.ts)
- Dev server: port 5180
- API proxy: `/api` → `http://localhost:3001`

---

## 13. Running the Application

```bash
# Install dependencies
npm run install:all

# Set up database
cd server
npx prisma migrate dev
npx prisma db seed

# Run both servers
cd ..
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5180
```

### Demo Credentials
| Email | Password | Role |
|-------|----------|------|
| demo@rfpai.com | demo123456 | Manager |
| suganya@rfpai.com | demo123456 | Analyst |
| sathish@rfpai.com | demo123456 | Analyst |

### Seed Data
- 3 pre-analyzed RFPs (Airport, Metro Construction, Warehouse Logistics)
- 7 competitor profiles with detailed intelligence
- 20+ historical bid records across industries
- Scoring criteria with AI strategies for each RFP

---

## 14. Demo Video Generator

**File**: `demo/run_demo.py`

Automated video demo tool using:
- **Playwright** — browser automation + video recording
- **edge-tts** — Microsoft Neural TTS for English narration (JennyNeural voice)
- **ffmpeg** — merges video + audio into final MP4

```bash
pip install playwright edge-tts moviepy imageio-ffmpeg
python -m playwright install chromium
python demo/run_demo.py
# Output: demo/output/RFP_Proposal_AI_Demo.mp4
```
