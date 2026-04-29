import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { initials } from "../api";
import { SettingsModal } from "./SettingsModal";
import { Icon } from "./ui";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: "dashboard" },
  { to: "/datasets", label: "Datasets", icon: "contacts" },
  { to: "/templates", label: "Templates", icon: "compose" },
  { to: "/logs", label: "Logs", icon: "inbox" },
  { to: "/sent-records", label: "Records", icon: "chart" },
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
  const [theme, setTheme] = useState(() => {
    try {
      const saved = window.localStorage.getItem("eaos-theme");
      if (saved === "dark" || saved === "light") {
        return saved;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClock(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem("eaos-theme", theme);
    } catch {
      // no-op for restricted contexts
    }
  }, [theme]);

  const currentPathLabel = useMemo(() => {
    if (location.pathname === "/") {
      return "Live overview";
    }
    return currentLabel;
  }, [currentLabel, location.pathname]);

  return (
    <div className="shell">
      <div className="shell-ambient" aria-hidden="true">
        <span className="shell-orb shell-orb-1" />
        <span className="shell-orb shell-orb-2" />
        <span className="shell-orb shell-orb-3" />
        <span className="shell-grid" />
      </div>

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
              title={item.label}
              aria-label={item.label}
            >
              <span className="nav-icon-wrap">
                <Icon className="icon-small" name={item.icon} />
              </span>
              <div className="nav-copy">
                <span className="nav-label">{item.label}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Profile card */}
          <button
            type="button"
            className="profile-card"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title="Settings"
          >
            <div className="profile-avatar">
              <span className="profile-initials">YY</span>
            </div>
            <div className="profile-card-copy">
              <strong className="profile-name">Yash Yadav</strong>
              <span className="profile-role">Workspace admin</span>
            </div>
            <Icon name="settings" className="icon-small profile-settings-icon" />
          </button>

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
            <div className="topbar-copy">
              <span className="topbar-section">{currentLabel}</span>
              <small>{currentSubtitle}</small>
            </div>
            <div className="topbar-meta" aria-label="Workspace status">
              <span className="topbar-chip">{currentPathLabel}</span>
              <span className="topbar-chip topbar-chip-time">{clock}</span>
              <button
                className="theme-toggle"
                type="button"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              >
                <span className={`theme-toggle-thumb ${theme === "dark" ? "theme-toggle-thumb-dark" : ""}`}>
                  <Icon className="icon-small" name={theme === "dark" ? "moon" : "sun"} />
                </span>
                <span className="theme-toggle-label">{theme === "dark" ? "Dark" : "Light"}</span>
              </button>
              {/* Profile / settings button in topbar */}
              <button
                type="button"
                className="topbar-profile-btn"
                onClick={() => setSettingsOpen(true)}
                aria-label="Open settings"
                title="Settings"
              >
                <span className="topbar-avatar">YY</span>
                <Icon name="settings" className="icon-small topbar-settings-chevron" />
              </button>
            </div>
          </div>
        </header>
        <main className="page-frame">{children}</main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
