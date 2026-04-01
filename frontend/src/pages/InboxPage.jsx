import { useEffect, useMemo, useRef, useState } from "react";
import { api, formatDateTime } from "../api";
import { useToast } from "../components/ToastProvider";
import { Button, EmptyState, Loader, Panel, StatusPill } from "../components/ui";

function cleanReplyContent(value = "") {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const kept = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^On .+ wrote:$/.test(trimmed)) {
      break;
    }
    if (trimmed.startsWith(">")) {
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n").trim() || value.trim();
}

function summarizeReply(summary = "", replyContent = "") {
  const cleanContent = cleanReplyContent(replyContent);
  const flatSummary = (summary || "").replace(/\s+/g, " ").trim();
  if (
    flatSummary &&
    !flatSummary.includes("wrote:") &&
    flatSummary.length <= 220 &&
    flatSummary.toLowerCase() !== cleanContent.toLowerCase()
  ) {
    return flatSummary;
  }
  if (!cleanContent) {
    return "No clear reply summary available.";
  }
  if (cleanContent.toLowerCase().endsWith("and you?")) {
    const answer = cleanContent.slice(0, -8).trim().replace(/[,\s]+$/, "");
    if (answer) {
      return `They answered "${answer}" and asked the same question back.`;
    }
  }
  const firstSentence = cleanContent.split(/\n|\./).find(Boolean)?.trim() || cleanContent;
  if (firstSentence.endsWith("?")) {
    return `They replied with a question: ${firstSentence}`;
  }
  return firstSentence.length > 180 ? `${firstSentence.slice(0, 177)}...` : firstSentence;
}

export function InboxPage() {
  const { pushToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [sending, setSending] = useState(false);
  const syncingRef = useRef(false);
  const suggestedIdsRef = useRef(new Set());

  async function loadReplies(nextSearch = search) {
    try {
      setLoading(true);
      const data = await api(`/api/logs/?search=${encodeURIComponent(nextSearch)}&filter_by=replied`);
      setLogs(data);
      setSelectedLog((current) => data.find((item) => item.id === current?.id) || data[0] || null);
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReplies();
  }, []);

  useEffect(() => {
    if (!selectedLog) {
      setReplyDraft("");
      setReplySubject("");
      return;
    }
    setReplyDraft(selectedLog.reply_suggestion || "");
    setReplySubject(selectedLog.subject?.startsWith("Re:") ? selectedLog.subject : `Re: ${selectedLog.subject || ""}`);
  }, [selectedLog?.id]);

  useEffect(() => {
    if (!selectedLog) {
      return;
    }
    const currentSuggestion = (selectedLog.reply_suggestion || "").toLowerCase();
    const looksGeneric =
      !currentSuggestion ||
      currentSuggestion.includes("thanks for your reply. i appreciate it.") ||
      currentSuggestion.includes("happy to share more detail") ||
      currentSuggestion.includes("i will get back to you with the details shortly");
    if (looksGeneric && !suggestedIdsRef.current.has(selectedLog.id)) {
      generateSuggestion(selectedLog, { silent: true });
    }
  }, [selectedLog?.id]);

  const visibleLogs = useMemo(() => logs, [logs]);
  const displayedReplyContent = selectedLog?.reply_content || selectedLog?.body || "";
  const cleanedReplyContent = cleanReplyContent(displayedReplyContent);
  const quickSummary = summarizeReply(selectedLog?.reply_summary, displayedReplyContent);

  async function syncInbox({ silent = false } = {}) {
    if (syncingRef.current) {
      return;
    }
    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await api("/api/automation/sync-inbox", {
        method: "POST",
        timeoutMs: 120000,
      });
      const message = result.new_replies?.length
        ? `${result.new_replies.length} new repl${result.new_replies.length === 1 ? "y" : "ies"} found`
        : result.message ||
          `Inbox checked successfully${typeof result.awaiting_replies === "number" ? `, ${result.awaiting_replies} awaiting repl${result.awaiting_replies === 1 ? "y" : "ies"}` : ""}`;
      if (!silent || result.new_replies?.length || result.message?.toLowerCase().includes("timed out")) {
        pushToast(message, result.message?.toLowerCase().includes("timed out") ? "error" : "success");
      }
      await loadReplies();
    } catch (error) {
      if (!silent) {
        pushToast(error.message, "error");
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }

  useEffect(() => {
    syncInbox({ silent: true });
    const intervalId = window.setInterval(() => {
      syncInbox({ silent: true });
    }, 45000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncInbox({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  async function generateSuggestion(targetLog = selectedLog, { silent = false } = {}) {
    if (!targetLog) {
      return;
    }
    setReplying(true);
    try {
      const suggestion = await api("/api/automation/reply-suggestion", {
        method: "POST",
        body: JSON.stringify({ email_log_id: targetLog.id }),
      });
      if (targetLog.id === selectedLog?.id) {
        setReplySubject(suggestion.suggested_subject || replySubject);
        setReplyDraft(suggestion.suggested_reply || "");
      }
      suggestedIdsRef.current.add(targetLog.id);
      if (!silent) {
        pushToast("Reply suggestion ready", "success");
      }
      await loadReplies();
    } catch (error) {
      if (!silent) {
        pushToast(error.message, "error");
      }
    } finally {
      setReplying(false);
    }
  }

  async function sendReply() {
    if (!selectedLog || !replyDraft.trim()) {
      pushToast("Nothing to send", "error");
      return;
    }
    setSending(true);
    try {
      await api("/api/automation/send-single-reply", {
        method: "POST",
        body: JSON.stringify({
          email_log_id: selectedLog.id,
          subject: replySubject,
          body: replyDraft,
        }),
      });
      pushToast("Reply sent", "success");
      await loadReplies();
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <Loader label="Loading replies" />;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Replies</p>
          <h1>See incoming replies clearly and answer them with approval-only suggestions.</h1>
          <p className="hero-description">
            This view only shows emails that received replies, so it stays focused and easy to scan.
          </p>
        </div>
        <div className="hero-actions">
          <Button busy={syncing} icon="sync" onClick={() => syncInbox()}>{syncing ? "Checking..." : "Check inbox"}</Button>
        </div>
      </section>

      <section className="logbook-layout">
        <Panel title="Replies" subtitle={`${visibleLogs.length} conversations`}>
          <div className="panel-toolbar">
            <input
              className="input"
              placeholder="Search by name, email, or subject"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button icon="search" onClick={() => loadReplies(search)} variant="secondary">Search</Button>
          </div>

          {visibleLogs.length ? (
            <div className="dataset-list">
              {visibleLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  className={`dataset-card ${selectedLog?.id === log.id ? "dataset-card-active" : ""}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="snippet-top">
                    <strong>{log.contact_name || log.recipient_email}</strong>
                    <StatusPill status={log.needs_attention ? "pending" : "received"} />
                  </div>
                  <span>{log.subject}</span>
                  <small>{formatDateTime(log.last_interaction_time)}</small>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon="inbox" title="No replies yet" description="Reply conversations will appear here after inbox sync finds a match." />
          )}
        </Panel>

        <Panel title="Reply details" subtitle={selectedLog ? (selectedLog.contact_name || selectedLog.recipient_email) : "Choose a reply"}>
          {selectedLog ? (
            <div className="thread-stack">
              <div className="log-summary-card">
                <div className="snippet-top">
                  <strong>{selectedLog.subject}</strong>
                  <StatusPill status={selectedLog.needs_attention ? "pending" : "received"} />
                </div>
                <div className="detail-block">
                  <span className="detail-label">Quick reply summary</span>
                  <p className="detail-summary">{quickSummary}</p>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Reply content</span>
                  <div className="plain-preview">{cleanedReplyContent || "No reply content captured"}</div>
                </div>
              </div>

              <div className="reply-box">
                <div className="panel-toolbar">
                  <h3>Suggested response</h3>
                  <Button icon="brain" onClick={generateSuggestion} variant="secondary">
                    {replying ? "Generating..." : "Suggest reply"}
                  </Button>
                </div>
                <label className="field">
                  <span>Subject</span>
                  <input className="input" value={replySubject} onChange={(event) => setReplySubject(event.target.value)} />
                </label>
                <label className="field">
                  <span>Reply body</span>
                  <textarea className="textarea textarea-medium" value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} />
                </label>
                <Button icon="send" onClick={sendReply}>
                  {sending ? "Sending..." : "Approve and send"}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState icon="mail" title="Select a reply" description="Pick a conversation from the left to read the reply and answer it." />
          )}
        </Panel>
      </section>
    </div>
  );
}
