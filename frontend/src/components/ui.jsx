import { Link } from "react-router-dom";
import { clamp, initials } from "../api";

const ICONS = {
  dashboard:
    "M3 12l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  contacts:
    "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M23 11h-6",
  compose:
    "M4 20l16-8L4 4v6l10 2-10 2v6Z",
  campaigns:
    "M4 13V6a2 2 0 0 1 2-2h2l10-2v16l-10-2H6a2 2 0 0 1-2-2v-3Zm14-7v8",
  spark:
    "M12 2l1.75 4.75L18 8.5l-4.25 1.75L12 15l-1.75-4.75L6 8.5l4.25-1.75L12 2Zm7 12 1 2.5L22.5 18 20 19l-1 2.5L18 19l-2.5-1.5L18 16.5 19 14ZM5 14l1 2.5L8.5 18 6 19l-1 2.5L4 19l-2.5-1.5L4 16.5 5 14Z",
  sync:
    "M20 6v5h-5M4 18v-5h5M6.5 9A7 7 0 0 1 19 11M17.5 15A7 7 0 0 1 5 13",
  plus: "M12 5v14M5 12h14",
  upload:
    "M12 16V6M8 10l4-4 4 4M5 18h14",
  search:
    "m21 21-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
  send:
    "M3 12 20 4l-5 16-3-7-9-1Z",
  trash:
    "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
  arrow:
    "M5 12h14M13 5l7 7-7 7",
  activity:
    "M4 13h4l2-7 4 12 2-5h4",
  rocket:
    "M5 19c0-2.5 2-4.5 4.5-4.5H12l3-3c1.5-1.5 2.5-3.5 3-5.5-2 .5-4 1.5-5.5 3L9.5 12v2.5C9.5 17 7.5 19 5 19Zm0 0 3-3M13 7h.01",
  brain:
    "M9 4a3 3 0 0 0-3 3v1.5A2.5 2.5 0 0 0 4 11v1a2.5 2.5 0 0 0 2 2.45V16a3 3 0 0 0 3 3h1m4-15a3 3 0 0 1 3 3v1.5A2.5 2.5 0 0 1 20 11v1a2.5 2.5 0 0 1-2 2.45V16a3 3 0 0 1-3 3h-1m-3-8V4m3 7V4m-5 8h10",
  mail:
    "M4 6h16v12H4zM4 7l8 6 8-6",
  target:
    "M12 3v3M12 18v3M3 12h3M18 12h3M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12",
  chart:
    "M5 19V9M12 19V5M19 19v-8",
  menu:
    "M4 7h16M4 12h16M4 17h16",
  inbox:
    "M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z",
  reply:
    "M9 17l-5-5 5-5M20 18v-2a4 4 0 0 0-4-4H4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z",
  filter:
    "M4 6h16M7 12h10M10 18h4",
  eye:
    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  check:
    "M20 6L9 17l-5-5",
  xmark:
    "M18 6 6 18M6 6l12 12",
  sun:
    "M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  moon:
    "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z",
};

export function Icon({ name, className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name] || ICONS.spark} />
    </svg>
  );
}

export function Button({
  children,
  icon,
  variant = "primary",
  className = "",
  href,
  busy = false,
  ...props
}) {
  const buttonClass = `button button-${variant} ${busy ? "button-busy" : ""} ${className}`.trim();

  const content = (
    <>
      {icon ? <Icon name={icon} className="button-icon" /> : null}
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link className={buttonClass} to={href} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={buttonClass} type="button" disabled={busy} {...props}>
      {content}
    </button>
  );
}

export function IconButton({ icon, label, className = "", ...props }) {
  return (
    <button
      className={`icon-button ${className}`.trim()}
      type="button"
      aria-label={label}
      {...props}
    >
      <Icon name={icon} className="icon-small" />
    </button>
  );
}

export function Panel({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`surface ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="surface-header">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          {actions ? <div className="surface-actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, description, actions, stats }) {
  return (
    <section className="hero-card reveal">
      <div className="hero-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p className="hero-description">{description}</p>
        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
      <div className="hero-metrics">
        {stats?.map((item) => (
          <div key={item.label} className="hero-stat">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.helper ? <small>{item.helper}</small> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MetricCard({ icon, label, value, helper, accent = "cyan" }) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <div className="metric-icon-wrap">
        <Icon name={icon} className="metric-icon" />
      </div>
      <div>
        <p className="metric-label">{label}</p>
        <h3>{value}</h3>
        {helper ? <span className="metric-helper">{helper}</span> : null}
      </div>
    </article>
  );
}

export function Tag({ children, tone = "neutral", active = false, ...props }) {
  return (
    <button
      className={`chip chip-${tone} ${active ? "chip-active" : ""}`.trim()}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

const STATUS_MAP = {
  success: "success",
  completed: "completed",
  running: "running",
  active: "active",
  draft: "draft",
  pending: "pending",
  failed: "failed",
  error: "error",
  smtp_failed: "smtp_failed",
  negative: "negative",
  positive: "positive",
  warm: "warm",
  neutral: "neutral",
  sent: "sent",
  received: "received",
};

export function StatusPill({ status }) {
  const normalized = (status || "neutral").toLowerCase().replace(/\s+/g, "_");
  const cls = STATUS_MAP[normalized] || "neutral";
  return (
    <span className={`status-pill status-${cls}`}>
      {normalized.replace(/_/g, " ")}
    </span>
  );
}

export function Loader({ label = "Loading" }) {
  return (
    <div className="loader-wrap">
      <div className="loader-ring" />
      <span>{label}</span>
      <span className="loader-brand">EAOS</span>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} className="icon-medium" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

// Deterministic gradient based on name string
function nameToGradient(name = "") {
  const str = name || "?";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 60%, 35%), hsl(${hue2}, 70%, 45%))`;
}

export function Avatar({ name, size = "medium" }) {
  const gradient = nameToGradient(name);
  return (
    <div
      className={`avatar avatar-${size}`}
      style={{ background: gradient }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function Progress({ value = 0 }) {
  const safe = clamp(Number(value) || 0, 0, 100);
  return (
    <div className="progress-shell">
      <div
        className="progress-fill"
        style={{ width: `${safe}%` }}
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export function Skeleton({ lines = 3, className = "" }) {
  const widths = ["100%", "85%", "70%", "90%", "60%", "80%", "75%"];
  return (
    <div className={`skeleton ${className}`.trim()}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

function priorityColor(priority) {
  if (!priority) return "#64748b";
  const p = Number(priority);
  if (p >= 8) return "#fb7185";
  if (p >= 6) return "#fbbf24";
  if (p >= 4) return "#38bdf8";
  return "#64748b";
}

export function InboxEmailCard({ email, active, onClick }) {
  const direction = email.direction || "received";
  const ts = email.timestamp
    ? new Date(email.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const priority = email.ai_analysis?.priority || email.priority;
  const intent = email.ai_analysis?.intent || email.intent;
  const tone = email.ai_analysis?.tone || email.tone;
  const summary = email.ai_analysis?.summary || email.summary;

  return (
    <div
      className={`email-thread-card ${active ? "email-thread-card-active" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className={`message-direction ${direction}`}>{direction}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {priority && (
            <span
              title={`Priority: ${priority}/10`}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: priorityColor(priority),
                flexShrink: 0,
                boxShadow: `0 0 6px ${priorityColor(priority)}`,
              }}
            />
          )}
          <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{ts}</span>
        </div>
      </div>

      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--text-strong)",
          lineHeight: 1.3,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {email.subject || "(No subject)"}
      </div>

      {summary ? (
        <div className="email-preview">{summary}</div>
      ) : email.body ? (
        <div className="email-preview">{email.body}</div>
      ) : null}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {intent && (
          <span className="static-chip">{intent}</span>
        )}
        {tone && (
          <span
            className="static-chip"
            style={{
              color: tone === "positive" ? "var(--lime)" : tone === "negative" ? "var(--rose)" : undefined,
              borderColor: tone === "positive" ? "rgba(52,211,153,0.25)" : tone === "negative" ? "rgba(251,113,133,0.25)" : undefined,
            }}
          >
            {tone}
          </span>
        )}
      </div>
    </div>
  );
}

export function EmailDetailView({ email, onReply, replyLoading, suggestedReply, onApproveSend, sending }) {
  const direction = email.direction || "received";
  const ts = email.timestamp
    ? new Date(email.timestamp).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const priority = email.ai_analysis?.priority || email.priority;
  const intent = email.ai_analysis?.intent || email.intent;
  const tone = email.ai_analysis?.tone || email.tone;
  const summary = email.ai_analysis?.summary || email.summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 28px 16px",
          borderBottom: "1px solid var(--line)",
          background: "var(--panel-elevated)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--text-strong)",
              lineHeight: 1.3,
              margin: 0,
              flex: 1,
            }}
          >
            {email.subject || "(No subject)"}
          </h3>
          <span className={`message-direction ${direction}`}>{direction}</span>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.78rem", color: "var(--muted)" }}>
          {email.from_address && (
            <span>
              <span style={{ color: "var(--muted-strong)", fontWeight: 500 }}>From:</span>{" "}
              {email.from_address}
            </span>
          )}
          {email.to_address && (
            <span>
              <span style={{ color: "var(--muted-strong)", fontWeight: 500 }}>To:</span>{" "}
              {email.to_address}
            </span>
          )}
          {ts && <span>{ts}</span>}
        </div>
      </div>

      {/* AI Analysis */}
      {(summary || intent || tone || priority) && (
        <div
          style={{
            padding: "14px 28px",
            borderBottom: "1px solid var(--line)",
            background: "linear-gradient(135deg, rgba(56,189,248,0.04), rgba(167,139,250,0.04))",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: 10 }}>AI Analysis</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {summary && (
              <p style={{ fontSize: "0.83rem", color: "var(--muted-strong)", lineHeight: 1.6, margin: 0 }}>
                {summary}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {intent && <span className="accent-chip">{intent}</span>}
              {tone && (
                <span
                  className="static-chip"
                  style={{
                    color: tone === "positive" ? "var(--lime)" : tone === "negative" ? "var(--rose)" : "var(--muted-strong)",
                    borderColor: tone === "positive" ? "rgba(52,211,153,0.25)" : tone === "negative" ? "rgba(251,113,133,0.25)" : undefined,
                  }}
                >
                  {tone}
                </span>
              )}
              {priority !== undefined && priority !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 120 }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                    Priority {priority}/10
                  </span>
                  <div className="progress-shell" style={{ flex: 1, maxWidth: 100 }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${(Number(priority) / 10) * 100}%`, background: priorityColor(priority) }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="email-body-frame">
        {email.body || <span className="muted">No content available.</span>}
      </div>

      {/* Reply Suggestion */}
      {suggestedReply && (
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid var(--line)",
            background: "rgba(52,211,153,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p className="eyebrow" style={{ color: "var(--lime)" }}>AI Suggested Reply</p>
          <textarea
            className="textarea"
            defaultValue={suggestedReply}
            style={{ minHeight: 120 }}
            id="reply-textarea"
          />
          <div className="panel-actions">
            <Button
              variant="primary"
              icon="send"
              onClick={() => {
                const el = document.getElementById("reply-textarea");
                onApproveSend?.(el?.value || suggestedReply);
              }}
              busy={sending}
            >
              {sending ? "Sending..." : "Approve & Send"}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          padding: "14px 28px",
          borderTop: suggestedReply ? "none" : "1px solid var(--line)",
          display: "flex",
          gap: 10,
          background: "var(--panel-elevated)",
        }}
      >
        {direction === "received" && (
          <Button
            variant="secondary"
            icon="reply"
            onClick={onReply}
            busy={replyLoading}
          >
            {replyLoading ? "Generating..." : "Suggest Reply"}
          </Button>
        )}
      </div>
    </div>
  );
}
