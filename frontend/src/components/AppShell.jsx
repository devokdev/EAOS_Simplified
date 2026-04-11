import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "./ui";

const NAV_ITEMS = [
  { to: "/", label: "Overview", short: "Home", icon: "dashboard" },
  { to: "/datasets", label: "Datasets", short: "Lists", icon: "contacts" },
  { to: "/templates", label: "Templates", short: "Compose", icon: "compose" },
  { to: "/logs", label: "Logs", short: "Replies", icon: "inbox" },
  { to: "/sent-records", label: "Records", short: "Sent", icon: "chart" },
];

const SECTION_SUBTITLE = {
  "/": "Monitor delivery, replies, and pending actions in one command center",
  "/datasets": "Build clean audience lists for dependable outbound execution",
  "/templates": "Compose, preview, and deliver personalized emails at scale",
  "/logs": "Review inbound replies, approve drafts, and respond faster",
  "/sent-records": "Track every conversation thread and reply status over time",
};

export function AppShell({ children }) {
  const location = useLocation();
  const currentLabel = NAV_ITEMS.find((item) => item.to === location.pathname)?.label || "Workspace";
  const currentSubtitle =
    SECTION_SUBTITLE[location.pathname] || "Focused workspace for outreach and reply operations";

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Icon name="spark" className="icon-medium" />
          </div>
          <div>
            <p className="brand-title">EAOS</p>
            <p className="brand-subtitle">Email operations workspace</p>
          </div>
        </div>

        <nav className="nav-stack">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`.trim()}
              end={item.to === "/"}
              to={item.to}
            >
              <Icon className="icon-small" name={item.icon} />
              <div>
                <span>{item.label}</span>
                <small>{item.short}</small>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-card subtle-card">
            <span className="status-dot" />
            <div>
              <strong>Auto sync active</strong>
              <small>Replies are monitored in the background.</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-title">
            <span className="topbar-section">{currentLabel}</span>
            <small>{currentSubtitle}</small>
          </div>
        </header>
        <main className="page-frame">{children}</main>
      </div>
    </div>
  );
}
