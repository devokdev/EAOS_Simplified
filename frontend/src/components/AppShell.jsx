import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "./ui";

const NAV_ITEMS = [
  { to: "/", label: "Overview", short: "Home", icon: "dashboard" },
  { to: "/datasets", label: "Datasets", short: "Lists", icon: "contacts" },
  { to: "/templates", label: "Templates", short: "Compose", icon: "compose" },
  { to: "/logs", label: "Logs", short: "Replies", icon: "inbox" },
  { to: "/sent-records", label: "Records", short: "Sent", icon: "chart" },
];

export function AppShell({ children }) {
  const location = useLocation();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Icon name="spark" className="icon-medium" />
          </div>
          <div>
            <p className="brand-title">EAOS</p>
            <p className="brand-subtitle">Email Automation</p>
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
          <div className="status-card">
            <span className="status-dot" />
            <div>
              <strong>Auto reply watch on</strong>
              <small>Inbox polling keeps new replies visible for approval.</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="mobile-topbar">
          <div className="mobile-brand">
            <div className="brand-mark brand-mark-small">
              <Icon name="spark" className="icon-small" />
            </div>
            <div>
              <p className="brand-title">EAOS</p>
              <p className="brand-subtitle">
                {NAV_ITEMS.find((item) => item.to === location.pathname)?.label || "Workspace"}
              </p>
            </div>
          </div>
        </header>
        <main className="page-frame">{children}</main>
      </div>
    </div>
  );
}
