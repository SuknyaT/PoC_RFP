# AI-Powered RFP Proposal Generator - Architecture Document

## Context
A company receiving RFPs (Request for Proposals) from clients across industries (airports, construction, logistics) needs an AI-powered tool to generate optimal bid proposals. The system uses historical bid data, competitor analysis, and scoring criteria analysis to maximize the chances of winning bids. The core value: given an RFP document, the system leverages Claude AI to parse the RFP, analyze scoring criteria, assess competitors, and generate a winning proposal with revenue model recommendations (flat minimum guarantee + profit share percentage).

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│              FRONTEND - React + Vite + TypeScript         │
│  Dashboard | RFP Upload | Proposal Generator | Competitors│
└────────────────────────┬─────────────────────────────────┘
                         │ REST API + SSE (streaming)
┌────────────────────────┴─────────────────────────────────┐
│              BACKEND - Node.js + Express + TypeScript      │
│  Auth | RFP Service | AI Service | Historical Data Service │
│                    ┌──────────┐                            │
│                    │ Claude AI │  @anthropic-ai/sdk         │
│                    └──────────┘                            │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────┐
│          DATA - PostgreSQL + Local File Storage            │
└──────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend (`/server`)
| Purpose | Library |
|---------|---------|
| Server framework | `express` |
| Language | `typescript` + `tsx` (dev runner) |
| AI SDK | `@anthropic-ai/sdk` |
| ORM | `prisma` |
| Database | `PostgreSQL` |
| PDF parsing | `pdf-parse` |
| Auth | `jsonwebtoken` + `bcrypt` |
| File upload | `multer` |
| Validation | `zod` |
| Streaming | `better-sse` (Server-Sent Events) |

### Frontend (`/client`)
| Purpose | Library |
|---------|---------|
| Build tool | `vite` |
| UI | `react` 19 with TypeScript |
| Routing | `react-router-dom` v7 |
| HTTP | `axios` |
| State | `zustand` |
| UI components | `tailwindcss` + `lucide-react` (icons) |
| Forms | `react-hook-form` |
| Charts | `recharts` |
| File upload | `react-dropzone` |
| Tables | `@tanstack/react-table` |

---

## Folder Structure

### Backend (`/server`)
```
server/
├── src/
│   ├── index.ts                      # Entry point
│   ├── app.ts                        # Express setup + middleware
│   ├── config/
│   │   ├── database.ts               # Prisma client
│   │   ├── environment.ts            # Env validation with Zod
│   │   └── claude.ts                 # Anthropic SDK init
│   ├── middleware/
│   │   ├── auth.ts                   # JWT verification
│   │   ├── upload.ts                 # Multer config
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── rfp.routes.ts
│   │   ├── proposal.routes.ts
│   │   ├── competitor.routes.ts
│   │   ├── competitorRfp.routes.ts
│   │   ├── historical.routes.ts
│   │   └── dashboard.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── rfp.controller.ts
│   │   ├── proposal.controller.ts
│   │   ├── competitor.controller.ts
│   │   ├── historical.controller.ts
│   │   └── dashboard.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── rfp.service.ts
│   │   ├── proposal.service.ts
│   │   ├── competitor.service.ts
│   │   ├── historical.service.ts
│   │   └── ai/
│   │       ├── claude.service.ts         # Anthropic SDK wrapper
│   │       ├── rfpParser.ai.ts           # Parse RFP documents
│   │       ├── scoringAnalyzer.ai.ts     # Analyze scoring criteria
│   │       ├── competitorAnalyzer.ai.ts  # Predict competitor strategies
│   │       └── proposalGenerator.ai.ts   # Generate proposals
│   ├── utils/
│   │   └── pdfParser.ts
│   └── types/
│       └── rfp.types.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── uploads/
├── package.json
└── tsconfig.json
```

### Frontend (`/client`)
```
client/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   ├── client.ts                # Axios instance with JWT interceptor
│   │   ├── rfp.api.ts
│   │   ├── proposal.api.ts
│   │   ├── competitor.api.ts
│   │   ├── historical.api.ts
│   │   └── auth.api.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── rfp/
│   │   │   ├── RfpUploader.tsx
│   │   │   ├── RfpParsedView.tsx
│   │   │   ├── ScoringCriteriaTable.tsx
│   │   │   └── RfpList.tsx
│   │   ├── proposal/
│   │   │   ├── ProposalEditor.tsx
│   │   │   ├── RevenueModelForm.tsx
│   │   │   ├── ProposalPreview.tsx
│   │   │   └── OptimizationPanel.tsx
│   │   ├── competitor/
│   │   │   ├── CompetitorList.tsx
│   │   │   ├── CompetitorForm.tsx
│   │   │   └── CompetitorAnalysis.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── RfpPipeline.tsx
│   │   │   └── WinRateChart.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       └── DataTable.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── RfpListPage.tsx
│   │   ├── RfpDetailPage.tsx
│   │   ├── NewRfpPage.tsx
│   │   ├── ProposalPage.tsx
│   │   ├── CompetitorsPage.tsx
│   │   ├── HistoricalDataPage.tsx
│   │   └── LoginPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRfp.ts
│   │   └── useProposal.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── rfpStore.ts
│   └── types/
│       └── index.ts
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## Database Schema (PostgreSQL via Prisma)

### Tables

**users** - id, email, password_hash, name, role (analyst/manager/admin)

**rfps** - id, title, client_name, industry, status (draft -> parsing -> analyzed -> proposal_draft -> submitted -> won/lost), project_scope, submission_deadline, contract_duration, estimated_value, location, original_filename, file_path, raw_text, created_by

**scoring_criteria** - id, rfp_id (FK), criterion_name, max_points, weight_pct, description, ai_strategy, sort_order

**competitors** - id, name, industries[], strengths, weaknesses, typical_bid_style, notes

**historical_bids** - id, rfp_title, client_name, industry, year, bidder_name, is_our_bid, flat_guarantee, profit_share_pct, other_terms (JSONB), outcome (won/lost/pending), winning_bid_summary, score_received, lessons_learned, competitor_id (FK)

**rfp_competitors** - id, rfp_id (FK), competitor_id (FK), expected_strategy, threat_level

**proposals** - id, rfp_id (FK), version, status (draft/review/final/submitted), recommended_flat_guarantee, recommended_profit_share, revenue_model_rationale, executive_summary, experience_section, approach_section, revenue_proposal, full_content (JSONB), predicted_score, optimization_notes, created_by

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Returns JWT
- `GET /api/auth/me` - Current user profile

### RFP Management
- `POST /api/rfps` - Upload RFP document (multipart/form-data)
- `GET /api/rfps` - List RFPs (filterable by status, industry)
- `GET /api/rfps/:id` - RFP detail with scoring criteria, competitors, proposals
- `PATCH /api/rfps/:id` - Update parsed fields
- `DELETE /api/rfps/:id`
- `POST /api/rfps/:id/parse` - Trigger AI parsing
- `POST /api/rfps/:id/analyze-scoring` - Analyze scoring criteria with AI

### Proposals
- `POST /api/rfps/:id/proposals` - Generate proposal with AI
- `GET /api/rfps/:id/proposals` - List proposal versions
- `GET /api/rfps/:id/proposals/:pid` - Get specific proposal
- `PATCH /api/rfps/:id/proposals/:pid` - Edit proposal content

### Competitors
- CRUD: `GET/POST/PATCH/DELETE /api/competitors`
- `POST /api/rfps/:id/competitors` - Link competitors + AI threat analysis
- `GET /api/rfps/:id/competitors` - Get competitor analysis for RFP

### Historical Data
- CRUD: `GET/POST/PATCH/DELETE /api/historical-bids`
- `GET /api/historical-bids/similar/:rfpId` - Find similar past bids

### Dashboard
- `GET /api/dashboard/stats` - Win rate, total RFPs, pipeline counts
- `GET /api/dashboard/pipeline` - RFPs grouped by status

---

## AI Integration (4 Pipelines using Claude API)

### Pipeline 1: RFP Document Parsing
- **Trigger:** User uploads PDF
- **Flow:** pdf-parse extracts text -> Claude extracts structured fields (title, client, scope, deadline, scoring criteria) -> Saved to DB
- **Output:** Structured RFP record + scoring_criteria rows

### Pipeline 2: Scoring Criteria Analysis
- **Trigger:** After parsing or on demand
- **Input:** Scoring criteria + historical winning bids in same industry + company strengths
- **Output:** Strategy per criterion + estimated achievable points

### Pipeline 3: Competitor Analysis
- **Trigger:** User links competitors to RFP
- **Input:** Competitor profiles + their historical bids + RFP details
- **Output:** Predicted strategies, threat levels, differentiation opportunities

### Pipeline 4: Proposal Generation (Core Value)
- **Trigger:** User clicks "Generate Proposal"
- **Input:** Parsed RFP + scoring strategies + competitor analysis + similar historical winners + company profile
- **Output:** Full proposal sections (executive summary, experience, approach, revenue) + revenue model (flat guarantee + profit share %) + predicted score
- **Streaming:** SSE to show generation progress on frontend

### Key AI Design Decisions
- Single large Claude call (200k context) per pipeline — simpler, more reliable for PoC
- All AI outputs validated through Zod schemas before DB save
- Responses cached — no re-calling Claude for same document unless explicitly requested

---

## Data Flow: Upload to Proposal

```
1. UPLOAD   → User uploads PDF → saved to /uploads, DB record created (status: draft)
2. PARSE    → pdf-parse extracts text → Claude parses to structured data → status: analyzed
3. REVIEW   → User reviews/corrects parsed fields, links competitors
4. ANALYZE  → AI runs competitor analysis → threat assessment saved
5. GENERATE → All context assembled → Claude generates proposal (streamed via SSE)
6. EDIT     → User reviews/edits proposal, can re-optimize (creates new version)
7. TRACK    → User records outcome (won/lost) → auto-creates historical bid record
```

---

## Implementation Phases

### Phase 1: Foundation + RFP Parsing
1. Initialize project structure (server + client)
2. Set up PostgreSQL + Prisma schema + migrations
3. Implement auth (register/login/JWT)
4. Build RFP upload endpoint + PDF parsing
5. Integrate Claude for RFP document parsing
6. Build frontend: login, RFP upload, parsed view

### Phase 2: Proposal Generation (Core Feature)
7. Build historical bids CRUD (backend + frontend)
8. Implement proposal generation AI pipeline
9. Build proposal editor page with SSE streaming
10. Revenue model form (flat guarantee + profit share)

### Phase 3: Competitor Analysis + Dashboard
11. Competitor CRUD + AI threat analysis
12. Scoring optimization ("re-optimize" feature)
13. Dashboard with stats, pipeline view, win rate chart
14. Seed sample data for demo
