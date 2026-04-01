import { useEffect, useMemo, useState } from "react";
import { api, buildQuery, formatDateTime } from "../api";
import { useToast } from "../components/ToastProvider";
import { Button, EmptyState, Loader, Panel, StatusPill } from "../components/ui";

const DEFAULT_FILTERS = {
  datasetId: "",
  status: "all",
  userQuery: "",
  search: "",
};

export function SentRecordsPage() {
  const { pushToast } = useToast();
  const [records, setRecords] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [markingReceived, setMarkingReceived] = useState(false);

  async function loadRecords(nextFilters = filters) {
    try {
      setLoading(true);
      const query = buildQuery({
        search: nextFilters.search,
        dataset_id: nextFilters.datasetId,
        status: nextFilters.status,
        user_query: nextFilters.userQuery,
      });
      const data = await api(`/api/logs/sent-records${query}`);
      setRecords(data);
      setSelectedRecord((current) => data.find((item) => item.thread_key === current?.thread_key && item.contact_id === current?.contact_id) || data[0] || null);
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadDatasets() {
    try {
      const data = await api("/api/datasets/");
      setDatasets(data);
    } catch (error) {
      pushToast(error.message, "error");
    }
  }

  useEffect(() => {
    loadDatasets();
    loadRecords();
  }, []);

  const summary = useMemo(() => {
    return records.reduce(
      (acc, item) => {
        acc.sent += item.sent_count || 0;
        acc.replies += item.reply_count || 0;
        if ((item.status || "").toLowerCase() === "pending") {
          acc.pending += 1;
        }
        return acc;
      },
      { sent: 0, replies: 0, pending: 0 },
    );
  }, [records]);

  async function markReceived() {
    if (!selectedRecord?.id) {
      return;
    }
    setMarkingReceived(true);
    try {
      await api(`/api/logs/${selectedRecord.id}/mark-received`, { method: "POST" });
      pushToast("Conversation marked as received", "success");
      await loadRecords();
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setMarkingReceived(false);
    }
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  if (loading) {
    return <Loader label="Loading records" />;
  }

  return (
    <div className="page-stack">
      <section className="page-hero compact-hero">
        <div>
          <p className="eyebrow">Records</p>
          <h1>Monitor every conversation with clear status and fast access.</h1>
          <p className="hero-description">
            Filter by dataset, user, or status to find the exact thread you need without wading through noise.
          </p>
        </div>
        <div className="hero-actions stats-inline">
          <div className="status-card">
            <div>
              <strong>{records.length} threads</strong>
              <small>{summary.pending} pending, {summary.replies} replies, {summary.sent} sends</small>
            </div>
          </div>
        </div>
      </section>

      <section className="records-layout">
        <Panel title="Filters" subtitle="Narrow records quickly">
          <div className="filter-grid">
            <label className="field">
              <span>Dataset</span>
              <select className="input" value={filters.datasetId} onChange={(event) => updateFilter("datasetId", event.target.value)}>
                <option value="">All datasets</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select className="input" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                <option value="all">All statuses</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
              </select>
            </label>
            <label className="field">
              <span>User</span>
              <input className="input" value={filters.userQuery} onChange={(event) => updateFilter("userQuery", event.target.value)} placeholder="Filter by name or email" />
            </label>
            <label className="field">
              <span>Search</span>
              <input className="input" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search subject or content" />
            </label>
          </div>
          <div className="action-row">
            <Button icon="filter" onClick={() => loadRecords(filters)} variant="secondary">Apply filters</Button>
            <Button
              icon="xmark"
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                loadRecords(DEFAULT_FILTERS);
              }}
              variant="ghost"
            >
              Reset
            </Button>
          </div>
        </Panel>

        <Panel title="Conversation records" subtitle={`${records.length} results`}>
          {records.length ? (
            <div className="record-list">
              {records.map((record) => (
                <button
                  key={`${record.contact_id || "no-contact"}-${record.thread_key}`}
                  type="button"
                  className={`record-row ${selectedRecord?.thread_key === record.thread_key && selectedRecord?.contact_id === record.contact_id ? "record-row-active" : ""}`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="record-row-main">
                    <div className="snippet-top">
                      <strong>{record.contact_name || record.recipient_email || "Unknown recipient"}</strong>
                      <StatusPill status={record.status || "sent"} />
                    </div>
                    <span>{record.subject || "(No subject)"}</span>
                    <small>
                      {record.dataset_name || "No dataset"} · last activity {formatDateTime(record.latest_reply_at || record.latest_sent_at)}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon="mail" title="No matching records" description="Try broadening the filters or send your first campaign." />
          )}
        </Panel>

        <Panel title="Thread detail" subtitle={selectedRecord ? (selectedRecord.contact_name || selectedRecord.recipient_email) : "Choose a record"}>
          {selectedRecord ? (
            <div className="thread-stack">
              <div className="detail-grid">
                <div className="detail-stat">
                  <span className="detail-label">Status</span>
                  <strong><StatusPill status={selectedRecord.status || "sent"} /></strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Dataset</span>
                  <strong>{selectedRecord.dataset_name || "No dataset"}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Recipient</span>
                  <strong>{selectedRecord.recipient_email || "Unknown"}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Replies</span>
                  <strong>{selectedRecord.reply_count}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Latest reply</span>
                  <strong>{selectedRecord.latest_reply_at ? formatDateTime(selectedRecord.latest_reply_at) : "No reply yet"}</strong>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Last sent</span>
                  <strong>{selectedRecord.latest_sent_at ? formatDateTime(selectedRecord.latest_sent_at) : "No send recorded"}</strong>
                </div>
              </div>

              <div className="log-summary-card">
                <div className="detail-block">
                  <span className="detail-label">Latest sent message</span>
                  <div className="plain-preview">{selectedRecord.body || "No message body stored."}</div>
                </div>
              </div>

              {selectedRecord.status === "pending" ? (
                <div className="action-row">
                  <Button icon="check" onClick={markReceived} variant="secondary" busy={markingReceived}>
                    {markingReceived ? "Saving..." : "Mark as received"}
                  </Button>
                  <Button href="/logs" icon="reply">Send reply</Button>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState icon="chart" title="Select a record" description="Pick a conversation to review its status and latest activity." />
          )}
        </Panel>
      </section>
    </div>
  );
}
