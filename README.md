# EAOS

EAOS is an AI-assisted email operations workspace for teams that send outbound emails, track replies, and want approval-first automation instead of blind autoresponders.

It combines:
- dataset-based contact management
- AI-assisted email writing before send
- Gmail inbox sync for reply detection
- thread-aware reply suggestions
- a sent-records view with reply counts

## Why this project is useful

EAOS is built for real workflows where teams send the first email, wait for replies, and need fast follow-up without losing context.

### Real-world use cases

1. Startup founder outreach
   Upload an investor, customer, or partner list, write a rough email like `hi {name}, wanted to show you what we are building`, let AI turn it into a polished message, send in batches, then review replies in one queue.

2. College fest and event invitations
   Import a guest list, write a short note like `invite {name} to annual fest`, generate a cleaner full email with subject and placeholders preserved, and track who replied and how many times.

3. Agency lead follow-up
   Send cold outreach to leads from a CSV, then use the replies page to see open conversations only. Once you answer a lead, that thread disappears from the pending queue until they reply again.

4. Alumni or placement cell communication
   Send internship, speaker-session, or mentorship invites to a curated dataset. When someone replies with a short message like `interested`, `what is the timing?`, or `haha sure`, EAOS captures it and generates a context-aware draft.

5. Internal ops or community management
   Use the sent records tab to keep a clean view of every sent thread, total replies received, and pending inbound messages that still need attention.

## Current product status

EAOS currently ships with these working flows:

- `Overview`
  Shows dataset count, contact count, sent volume, reply volume, response rate, and recent activity.

- `Datasets`
  Import CSV contacts, browse list members, remove selected entries, or wipe datasets fully.

- `Templates / Compose`
  Write the email body in rough form, optionally enable AI, preview the final subject and body, and send to all or selected contacts from a dataset.

- `Logs / Replies`
  Sync Gmail inbox replies from known contacts, show unresolved reply threads, read reply content, generate a suggested response, and send approval-first replies.

- `Records / Sent`
  View sent conversations with total reply count and pending reply count per thread.

## What makes EAOS impressive

- AI can turn rough notes into a send-ready email before preview.
- Subject is optional; EAOS can generate it from intent.
- Placeholders like `{name}` and `{email}` are preserved during AI refinement.
- Reply suggestions use the conversation thread instead of just one isolated message.
- The inbox queue only shows threads that still need action.
- Once you reply, the thread leaves the pending queue until the recipient replies again.
- Sent-thread records give you a lightweight CRM-style view without needing a full CRM.

## Tech stack

- FastAPI
- PostgreSQL / Supabase Postgres
- Google Gemini
- Gmail SMTP + IMAP
- React
- Vite
 
## Project structure

```text
backend/
  main.py
  routes/
    automation.py
    dashboard_v2.py
    datasets.py
    logbook.py
    templates.py
  services/
    gemini_service.py
    gmail_service.py
    templates_service.py

frontend/
  src/
    pages/
      DashboardPage.jsx
      ContactsPage.jsx
      ComposePage.jsx
      InboxPage.jsx
      SentRecordsPage.jsx
```

## Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://username:password@host:5432/postgres
GEMINI_KEY_1=your_gemini_key
GEMINI_KEY_2=optional_second_key
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

## Setup

### Backend

```powershell
py -3 -m pip install -r requirements.txt
```

### Frontend

```powershell
cd frontend
npm install
```

## Run locally

### Backend

```powershell
py -3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```powershell
cd frontend
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Main flows

### 1. Send a polished email from rough input

1. Open `Templates`.
2. Choose a dataset.
3. Write a rough body like `hi {name}, invite you to our product demo next week`.
4. Enable `Use AI to refine or write the full email before preview`.
5. Click `Preview`.
6. Review the generated subject and body.
7. Click `Send after review`.

### 2. Process replies without losing context

1. Open `Logs`.
2. Let inbox sync run or click `Check inbox`.
3. Select a reply thread.
4. Review the captured reply content.
5. Click `Suggest reply`.
6. Approve or edit the draft.
7. Click `Approve and send`.

### 3. Track sent threads and reply counts

1. Open `Records`.
2. Review each sent conversation.
3. See total replies and pending replies per thread.
4. Use it as a lightweight outreach tracker.

## Key API routes

- `GET /health`
- `GET /api/dashboard/overview`
- `GET /api/datasets/`
- `GET /api/datasets/{dataset_id}/contacts`
- `DELETE /api/datasets/`
- `GET /api/templates/`
- `POST /api/automation/preview`
- `POST /api/automation/send`
- `POST /api/automation/sync-inbox`
- `POST /api/automation/reply-suggestion`
- `POST /api/automation/send-single-reply`
- `GET /api/logs/?filter_by=replied`
- `GET /api/logs/sent-records`

## Notes

- Gmail inbox sync only tracks replies from contacts that already exist in your datasets.
- Replies are matched against sent threads using normalized thread keys and stored in the database.
- The reply queue is approval-first, not automatic sending.
- The sent records page is useful for outreach tracking even if you do not use a CRM.

## Health check

If the backend is running correctly:

```text
http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok","service":"EAOS"}
```
