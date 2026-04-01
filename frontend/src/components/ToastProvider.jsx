import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext({
  pushToast: () => {},
});

const TOAST_DURATION = 3800;

const TOAST_ICONS = {
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" />
    </svg>
  ),
};

const TOAST_COLORS = {
  info: "var(--cyan)",
  success: "var(--lime)",
  error: "var(--rose)",
  warning: "var(--amber)",
};

function normalizeToastMessage(message) {
  if (typeof message === "string") {
    return message;
  }
  if (message instanceof Error) {
    return message.message || "Something went wrong";
  }
  if (message && typeof message === "object") {
    if (typeof message.message === "string") {
      return message.message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return "Something went wrong";
    }
  }
  return String(message || "Something went wrong");
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message: normalizeToastMessage(message), type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role="alert"
            aria-live="assertive"
          >
            <div
              className="toast-icon"
              style={{ color: TOAST_COLORS[toast.type] || TOAST_COLORS.info }}
            >
              {TOAST_ICONS[toast.type] || TOAST_ICONS.info}
            </div>
            <span style={{ flex: 1, fontSize: "0.875rem" }}>{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismissToast(toast.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                padding: "0 0 0 8px",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
