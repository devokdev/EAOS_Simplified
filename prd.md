## EAOS Working PRD

Last updated: 2026-03-26

Note: the original `prd.md` was empty. This document is reconstructed from the implemented backend, the rebuilt frontend, and the current product direction in the repository.

### Product

EAOS is an AI-native email operations workspace for founders, operators, and outbound teams who want to manage contacts, draft personalized emails, sync inbox activity, and launch targeted campaigns from one system.

### Core user outcomes

1. Store and segment contacts with company context and audience tags.
2. Generate AI-assisted contact intelligence from conversation history.
3. Draft and send high-signal emails without leaving the workspace.
4. Launch lightweight personalized campaigns against tag-based segments.
5. Monitor recent activity, top contacts, and campaign performance from a central dashboard.

### Primary workflows

#### Dashboard

- View top-level stats for contacts, sent emails, received emails, and campaigns.
- See recent activity and AI memory logs from synced inbox conversations.
- Monitor campaign reply rates and top contacts by engagement score.

#### Contacts

- Add contacts manually or import from CSV.
- Filter by free-text search and audience tag.
- Refresh an AI profile using historical email context.
- Review recent emails and jump directly into compose.

#### Compose

- Select a contact and inspect recent thread history.
- Seed AI with context plus operator instructions.
- Generate a draft without sending a real email.
- Edit the draft and send via Gmail.

#### Campaigns

- Create campaigns with subject and body templates.
- Target all contacts or a subset via tags.
- Optionally define one A/B subject variant.
- Launch personalized sends and track campaign-level metrics.

### Functional requirements

#### Backend

- FastAPI API with MongoDB persistence.
- Contacts, emails, campaigns, dashboard, activity logs, and memory logs collections.
- Gmail SMTP send and IMAP inbox sync.
- Gemini-powered email analysis, contact profiling, campaign personalization, and draft generation.
- SPA asset serving from the built React frontend.

#### Frontend

- React single-page application.
- Responsive app shell with dashboard, contacts, compose, and campaigns routes.
- Premium operator-style UI with strong information hierarchy.
- Toast feedback, modal workflows, and empty/loading states.

### Current implementation status

#### Complete now

- React SPA replaces the legacy static multi-page HTML frontend.
- Dashboard uses an aggregated overview endpoint.
- Contacts view supports search, tags, profile detail, add, delete, CSV import, and AI refresh.
- Compose view supports safe AI draft generation and send flow.
- Campaigns view supports create, delete, launch, analytics, and audience tag selection.
- FastAPI now serves the built SPA bundle from `frontend/dist`.

#### Backend improvements added in this pass

- Added `POST /api/emails/generate-draft` to generate AI drafts without sending emails.
- Added `GET /api/contacts/meta/tags` for tag-level audience summaries.
- Added `GET /api/dashboard/overview` for a richer dashboard payload.
- Improved email send behavior to stop treating failed SMTP sends as successful sends.
- Added inbox sync activity logging.
- Improved campaign launches to persist personalized subjects and update contact follow-up metadata.

#### Known constraints

- Campaign launching is still synchronous and not queued/backgrounded.
- Reply/conversion metrics are stored but not yet automatically inferred from inbox activity.
- Gmail and Gemini credentials are still environment-variable driven, with no settings UI.
- There is no auth or multi-user workspace model yet.

### Next recommended phase

1. Add background jobs for campaign launches and inbox sync.
2. Infer campaign replies/conversions from inbound email matching.
3. Add auth, workspace settings, and secrets management UI.
4. Introduce richer campaign sequencing, analytics trends, and template libraries.
