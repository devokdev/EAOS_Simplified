import { useEffect, useState } from "react";
import { api, formatDateTime } from "../api";
import { useToast } from "../components/ToastProvider";
import { Button, EmptyState, Loader, Panel, StatusPill } from "../components/ui";

function StatCard({ label, value, helper }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

export function DashboardPage() {
  const { pushToast } = useToast();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadOverview() {
    try {
      const data = await api("/api/dashboard/overview");
      setOverview(data);
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function syncInbox() {
    setSyncing(true);
    try {
      const result = await api("/api/automation/sync-inbox", { method: "POST" });
      pushToast(
        result.new_replies?.length
          ? `${result.new_replies.length} new repl${result.new_replies.length === 1 ? "y" : "ies"} found`
          : "Inbox checked successfully",
        "success",
      );
      await loadOverview();
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <Loader label="Loading overview" />;
  }

  const stats = overview?.stats || {};
  const recentActivity = overview?.recent_activity || [];
  const recentLogs = overview?.recent_logs || [];

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Minimal workflow</p>
          <h1>Upload a dataset, preview a template, send in batches, and track replies.</h1>
          <p className="hero-description">
            This workspace keeps bulk sending, contact CRUD, reply review, and lightweight reporting in one simple flow.
          </p>
        </div>
        <div className="hero-actions">
          <Button href="/datasets" icon="upload">Add dataset</Button>
          <Button href="/templates" icon="compose" variant="secondary">Compose email</Button>
          <Button icon="sync" onClick={syncInbox} variant="secondary">
            {syncing ? "Checking inbox..." : "Check inbox"}
          </Button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Datasets" value={stats.datasets || 0} helper="Reusable contact lists" />
        <StatCard label="Contacts" value={stats.contacts || 0} helper="Stored in Supabase" />
        <StatCard label="Emails sent" value={stats.total_sent || 0} helper="Successful outbound messages" />
        <StatCard label="Replies" value={stats.replies || 0} helper="Matched from inbox sync" />
        <StatCard label="Response rate" value={`${stats.response_rate || 0}%`} helper="Replies divided by sent emails" />
        <StatCard label="Needs attention" value={stats.needs_attention || 0} helper="Replies waiting for approval" />
      </section>

      <section className="two-column-grid">
        <Panel title="Recent activity" subtitle="Latest system actions">
          {recentActivity.length ? (
            <div className="simple-table">
              <div className="table-row table-head">
                <span>Action</span>
                <span>Recipient</span>
                <span>Status</span>
                <span>Time</span>
              </div>
              {recentActivity.map((item, index) => (
                <div className="table-row" key={`${item.timestamp}-${index}`}>
                  <span>{item.action.replaceAll("_", " ")}</span>
                  <span>{item.recipient}</span>
                  <StatusPill status={item.status} />
                  <span>{formatDateTime(item.timestamp)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="activity"
              title="No activity yet"
              description="Upload a dataset or send your first batch to start building the logbook."
            />
          )}
        </Panel>

        <Panel title="Recent conversations" subtitle="Latest logbook items">
          {recentLogs.length ? (
            <div className="stack-list">
              {recentLogs.map((log) => (
                <div className="conversation-snippet" key={log.id}>
                  <div className="snippet-top">
                    <strong>{log.contact_name || log.recipient_email}</strong>
                    {log.needs_attention ? <StatusPill status="pending" /> : <StatusPill status={log.direction} />}
                  </div>
                  <p>{log.subject}</p>
                  <small>{formatDateTime(log.timestamp)}</small>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="mail"
              title="No conversations yet"
              description="Sent emails and matched replies will appear here once the system is in use."
            />
          )}
        </Panel>
      </section>
    </div>
  );
}
