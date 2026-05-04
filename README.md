# EAOS Simplified

AI-assisted Email Operations System for dataset-driven outreach, inbox sync, and approval-first replies.

## 1) Executive Summary

EAOS Simplified is a full-stack outreach workspace that lets teams:

- import contact datasets from CSV
- generate/refine outbound emails with Gemini
- send batch emails through Gmail SMTP
- sync inbox replies from Gmail IMAP
- generate thread-aware reply suggestions
- resolve pending conversations from a single queue
- track sent-thread status with lightweight CRM-like records

## 2) Why This Project Matters

| Problem in real workflows | EAOS response |
|---|---|
| Outreach tools send fast but lose reply context | Thread-keyed reply tracking + pending queue |
| Draft quality is inconsistent across users | AI-assisted preview/refinement before send |
| Teams miss unanswered replies | `needs_attention` based inbox triage |
| CRM tools can be heavy for simple campaigns | Lean dataset + records model |

## 3) Product Scope (Current Build)

### Included in the running app

| Module | Status | Notes |
|---|---|---|
| Dashboard | Active | `/api/dashboard/overview` aggregation |
| Datasets + Contacts | Active | CRUD + CSV upload |
| Templates/Compose | Active | Preview + batch send + optional HTML template |
| Logs/Replies | Active | Inbox sync + AI suggestion + approve/send |
| Sent Records | Active | Thread rollup by status/reply count |

### Present in repo but not mounted in current `backend/main.py`

| Module | Status | Note |
|---|---|---|
| `contacts.py`, `emails.py`, `campaigns.py`, `dashboard.py` routes | Legacy/experimental | Not included by `app.include_router(...)` in this simplified runtime |
| `eaos-web/frontend` | Separate frontend package | Appears to be an alternate marketing/presentation frontend |

## 4) System Architecture

```mermaid
flowchart LR
    U[Operator in React UI] --> F[Frontend - Vite React SPA]
    F -->|REST| B[FastAPI Backend]

    subgraph Core Services
      B --> A1[Automation Routes]
      B --> A2[Datasets Routes]
      B --> A3[Logs Routes]
      B --> A4[Templates Routes]
      B --> A5[Dashboard Routes]
    end

    A1 --> G1[Gemini Service]
    A1 --> M1[Gmail SMTP Service]
    A1 --> M2[Gmail IMAP Service]

    A2 --> DB[(PostgreSQL via asyncpg)]
    A3 --> DB
    A4 --> DB
    A5 --> DB
    A1 --> DB

    G1 -->|LLM| X[Gemini 2.5 Flash]
    M1 -->|send| Y[Gmail SMTP]
    M2 -->|fetch| Z[Gmail IMAP]
```

## 5) End-to-End Flow Diagrams

### 5.1 Outbound preview + send

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend
    participant API as FastAPI
    participant AI as Gemini
    participant Mail as Gmail SMTP
    participant DB as Postgres

    User->>UI: Write body + placeholders + options
    UI->>API: POST /api/automation/preview
    API->>AI: refine_email_copy(...)
    AI-->>API: subject + body
    API-->>UI: rendered preview

    User->>UI: Approve & send
    UI->>API: POST /api/automation/send
    loop per contact
        API->>AI: optional refine
        API->>Mail: send_email(...)
        API->>DB: INSERT email_logs + activity_logs
    end
    API-->>UI: sent/failed totals
```

### 5.2 Inbox sync + pending queue

```mermaid
sequenceDiagram
    participant Cron as UI Poll/Manual Trigger
    participant API as FastAPI
    participant IMAP as Gmail IMAP
    participant AI as Gemini
    participant DB as Postgres

    Cron->>API: POST /api/automation/sync-inbox
    API->>IMAP: fetch_inbox(limit, since_days)
    IMAP-->>API: recent messages
    loop matched sender + thread
      API->>DB: check dedupe + sent anchor
      API->>AI: summarize_reply_with_context(...)
      API->>DB: INSERT received log
      API->>DB: UPDATE sent anchor needs_attention=true
    end
    API-->>Cron: checked/matched/new_replies/awaiting_replies
```

### 5.3 Approval-first reply cycle

```mermaid
stateDiagram-v2
    [*] --> Sent
    Sent --> Pending : inbound reply matched
    Pending --> Suggested : POST /reply-suggestion
    Suggested --> SentReply : POST /send-single-reply
    Suggested --> Received : mark-received
    SentReply --> [*]
    Received --> [*]
```

## 6) Data Model

### 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    DATASETS ||--o{ DATASET_CONTACTS : contains
    DATASETS ||--o{ EMAIL_LOGS : scopes
    DATASET_CONTACTS ||--o{ EMAIL_LOGS : exchanges
    EMAIL_LOGS ||--o{ ACTIVITY_LOGS : generates

    DATASETS {
        uuid id PK
        text name
        text source_filename
        timestamp created_at
    }

    DATASET_CONTACTS {
        uuid id PK
        uuid dataset_id FK
        text name
        text email
        timestamp created_at
    }

    EMAIL_LOGS {
        uuid id PK
        uuid dataset_id FK
        uuid contact_id FK
        text direction
        text subject
        text body
        text status
        text thread_key
        bool needs_attention
        timestamp created_at
        timestamp last_interaction_at
    }

    ACTIVITY_LOGS {
        uuid id PK
        text action
        text recipient
        text status
        jsonb details
        timestamp timestamp
    }
```

### 6.2 Thread logic summary

| Field | Purpose |
|---|---|
| `thread_key` | Normalized subject/thread identity |
| `direction` | `sent` or `received` |
| `needs_attention` | Triage bit for pending response |
| `last_interaction_at` | Sorting and recency anchor |
| `reply_summary` | Human-readable latest context |
| `reply_suggestion` | Draft produced by AI for operator approval |

## 7) API Surface (Active Runtime)

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Service liveness |
| `GET` | `/api/dashboard/overview` | Aggregated KPI + recent events |
| `GET` | `/api/datasets/` | List datasets |
| `POST` | `/api/datasets/` | Create dataset |
| `POST` | `/api/datasets/upload` | CSV import into dataset |
| `GET` | `/api/datasets/{dataset_id}` | Get single dataset |
| `DELETE` | `/api/datasets/{dataset_id}` | Delete dataset |
| `GET` | `/api/datasets/{dataset_id}/contacts` | List contacts in dataset |
| `POST` | `/api/datasets/{dataset_id}/contacts` | Add contact |
| `PUT` | `/api/datasets/contacts/{contact_id}` | Update contact |
| `DELETE` | `/api/datasets/contacts/{contact_id}` | Delete contact |
| `GET` | `/api/templates/` | List built-in HTML templates |
| `POST` | `/api/automation/preview` | Generate/refine and preview outbound message |
| `POST` | `/api/automation/send` | Batch send outbound messages |
| `POST` | `/api/automation/sync-inbox` | Pull inbox and match replies |
| `POST` | `/api/automation/reply-suggestion` | Generate thread-aware reply draft |
| `POST` | `/api/automation/send-single-reply` | Approve and send reply |
| `GET` | `/api/logs/` | Pending reply thread listing |
| `GET` | `/api/logs/sent-records` | Sent thread rollup view |
| `POST` | `/api/logs/{log_id}/mark-received` | Mark thread resolved |
| `GET` | `/api/logs/{log_id}/thread` | Fetch full thread timeline |

## 8) Frontend Route Map

| Route | Screen | Purpose |
|---|---|---|
| `/` | Dashboard | KPI and recent activity |
| `/datasets` | ContactsPage | Dataset/contact management |
| `/templates` | ComposePage | Preview/refine/send flow |
| `/logs` | InboxPage | Pending replies + AI draft |
| `/sent-records` | SentRecordsPage | Thread analytics and status |

## 9) Tech Stack

| Layer | Tech |
|---|---|
| API | FastAPI |
| Runtime | Python 3.10+ |
| DB Driver | asyncpg |
| Database | PostgreSQL (Supabase-compatible) |
| AI | Google Gemini (`gemini-2.5-flash`) |
| Mail Send | Gmail SMTP |
| Mail Fetch | Gmail IMAP |
| Frontend | React 18 + Vite |

## 10) Environment Configuration

Create `.env` in project root.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `GEMINI_KEY_1` | Yes (for AI features) | Primary Gemini API key |
| `GEMINI_KEY_2` | Optional | Secondary key for round-robin |
| `GMAIL_USER` | Yes (for mail features) | Gmail sender account |
| `GMAIL_APP_PASSWORD` | Yes (for mail features) | App password (not account password) |

Example:

```env
DATABASE_URL=postgresql://username:password@host:5432/postgres
GEMINI_KEY_1=your_gemini_key
GEMINI_KEY_2=optional_second_key
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

## 11) Local Setup

### Backend

```powershell
py -3 -m pip install -r requirements.txt
py -3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Access

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://127.0.0.1:8000/health`

## 12) Operational Behavior and Constraints

| Area | Current behavior |
|---|---|
| Sending | Synchronous per contact loop; batch pause supported |
| Inbox sync | Single-flight lock to prevent overlapping runs |
| Dedupe | `provider_message_id` fallback + thread/body checks |
| Matching | Only replies from known dataset contacts are processed |
| Auth | No user authentication in current simplified build |
| CORS | Wide open (`allow_origins=["*"]`) |

## 13) Quality Notes

### Strengths

- clear data model for thread attention status
- pragmatic AI fallback heuristics when model output is weak
- approval-first reply loop reduces unintended auto-send risk
- useful rollup analytics from minimal schema

### Improvement opportunities

- add background workers (queue) for campaign-scale send/sync
- add auth + role model + secrets management UI
- harden mail parsing for richer MIME/attachment handling
- add automated tests for route-level workflows
- tighten CORS and production security posture

## 14) KPI Graphs (Formula-Level)

### 14.1 Core metric equations

| KPI | Formula |
|---|---|
| Response Rate | `received_count / successful_sent_count * 100` |
| Pending Threads | `count(received where needs_attention=true and latest per thread)` |
| Send Success Rate | `sent_ok / total_send_attempts * 100` |

### 14.2 Pipeline graph (conceptual)

```text
Contacts Imported  [####################] 100%
Preview Approved   [###############-----]  75%
Sent Successfully  [#############-------]  65%
Replies Received   [######--------------]  30%
Pending to Resolve [###-----------------]  15%
```

### 14.3 Effort distribution chart (conceptual)

```mermaid
pie showData
    title Engineering Weight Distribution
    "Backend Workflow Logic" : 40
    "Frontend Product UX" : 28
    "Integration (Gmail + Gemini)" : 22
    "Schema + Reporting Layer" : 10
```

## 15) Suggested Production Hardening Roadmap

```mermaid
gantt
    title EAOS Simplified Hardening Plan
    dateFormat  YYYY-MM-DD
    section Security
    Auth + RBAC + Tenant model      :a1, 2026-05-10, 14d
    Secrets management UI            :a2, after a1, 7d
    CORS and API policy hardening    :a3, after a1, 5d

    section Scalability
    Queue for outbound send          :b1, 2026-05-12, 12d
    Async inbox sync jobs            :b2, after b1, 10d

    section Intelligence
    Reply attribution improvements   :c1, 2026-05-20, 10d
    Campaign conversion inference    :c2, after c1, 10d

    section Reliability
    Integration test suite           :d1, 2026-05-08, 12d
    Observability + alerts           :d2, after d1, 7d
```

## 16) Repository Structure

```text
EAOS_Simplified/
  backend/
    main.py
    config.py
    database.py
    routes/
      automation.py
      datasets.py
      dashboard_v2.py
      logbook.py
      templates.py
    services/
      gemini_service.py
      gmail_service.py
      templates_service.py
  frontend/
    src/
      App.jsx
      api.js
      pages/
        DashboardPage.jsx
        ContactsPage.jsx
        ComposePage.jsx
        InboxPage.jsx
        SentRecordsPage.jsx
  prd.md
  requirements.txt
  run.py
```

## 17) Quick Demo Script (5-7 min)

1. Create dataset and upload CSV.
2. Open Compose, draft rough copy with placeholders, enable AI improve.
3. Preview and send to selected subset.
4. Trigger inbox sync and show pending reply detection.
5. Generate reply suggestion and approve send.
6. Open Sent Records to show thread status and reply counters.

## 18) License / Academic Use

Use this project ethically with accurate attribution, transparent claims, and reproducible demos.

---

For a viva-ready speaking script and slide narrative, see `presentation.md`.
