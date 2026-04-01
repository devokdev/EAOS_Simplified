import { useEffect, useMemo, useState } from "react";
import { api, formatDateTime } from "../api";
import { useToast } from "../components/ToastProvider";
import { Button, EmptyState, Loader, Panel, StatusPill } from "../components/ui";

export function SentRecordsPage() {
  const { pushToast } = useToast();
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadRecords(nextSearch = search) {
    try {
      setLoading(true);
      const data = await api(`/api/logs/sent-records?search=${encodeURIComponent(nextSearch)}`);
      setRecords(data);
      setSelectedRecord((current) => data.find((item) => item.thread_key === current?.thread_key && item.contact_id === current?.contact_id) || data[0] || null);
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const summary = useMemo(() => {
    return records.reduce(
      (acc, item) => {
        acc.sent += item.sent_count || 0;
        acc.replies += item.reply_count || 0;
        acc.pending += item.pending_replies || 0;
        return acc;
      },
      { sent: 0, replies: 0, pending: 0 },
    );
  }, [records]);

  if (loading) {
    return <Loader label="Loading sent records" />;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Sent Records</p>
          <h1>Track every sent conversation and how many replies it received.</h1>
          <p className="hero-description">
            This view keeps a clean record of sent threads, total replies, and which conversations still have pending inbound messages.
          </p>
        </div>
        <div className="hero-actions">
          <div className="status-card">
            <div>
              <strong>{summary.sent} sent</strong>
              <small>{summary.replies} replies recorded, {summary.pending} pending</small>
            </div>
          </div>
        </div>
      </section>

      <section className="logbook-layout">
        <Panel title="Sent conversations" subtitle={`${records.length} tracked threads`}>
          <div className="panel-toolbar">
            <input
              className="input"
              placeholder="Search by name, email, or subject"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button icon="search" onClick={() => loadRecords(search)} variant="secondary">Search</Button>
          </div>

          {records.length ? (
            <div className="dataset-list">
              {records.map((record) => (
                <button
                  key={`${record.contact_id || "no-contact"}-${record.thread_key}`}
                  type="button"
                  className={`dataset-card ${selectedRecord?.thread_key === record.thread_key && selectedRecord?.contact_id === record.contact_id ? "dataset-card-active" : ""}`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="snippet-top">
                    <strong>{record.contact_name || record.recipient_email || "Unknown recipient"}</strong>
                    <StatusPill status={record.pending_replies ? "pending" : "sent"} />
                  </div>
                  <span>{record.subject || "(No subject)"}</span>
                  <small>{record.reply_count} repl{record.reply_count === 1 ? "y" : "ies"} · last sent {formatDateTime(record.latest_sent_at)}</small>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="mail"
              title="No sent records yet"
              description="Sent conversations will appear here once you start emailing contacts."
            />
          )}
        </Panel>

        <Panel
          title="Conversation summary"
          subtitle={selectedRecord ? (selectedRecord.contact_name || selectedRecord.recipient_email) : "Choose a conversation"}
        >
          {selectedRecord ? (
            <div className="thread-stack">
              <div className="detail-grid">
                <div className="detail-stat">
                  <span className="detail-label">Subject</span>
                  <strong>{selectedRecord.subject || "(No subject)"}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Recipient</span>
                  <strong>{selectedRecord.recipient_email || "Unknown"}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Emails sent</span>
                  <strong>{selectedRecord.sent_count}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Replies received</span>
                  <strong>{selectedRecord.reply_count}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Pending replies</span>
                  <strong>{selectedRecord.pending_replies}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Last reply</span>
                  <strong>{selectedRecord.latest_reply_at ? formatDateTime(selectedRecord.latest_reply_at) : "No reply yet"}</strong>
                </div>
              </div>

              <div className="log-summary-card">
                <div className="detail-block">
                  <span className="detail-label">Latest sent body</span>
                  <div className="plain-preview">{selectedRecord.body || "No message body stored."}</div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="chart"
              title="Select a sent thread"
              description="Pick a conversation from the left to see how many replies it has received."
            />
          )}
        </Panel>
      </section>
    </div>
  );
}
