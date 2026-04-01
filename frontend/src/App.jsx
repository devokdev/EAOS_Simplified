import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api";
import { AppShell } from "./components/AppShell";
import { useToast } from "./components/ToastProvider";
import { DashboardPage } from "./pages/DashboardPage";
import { ContactsPage } from "./pages/ContactsPage";
import { ComposePage } from "./pages/ComposePage";
import { InboxPage } from "./pages/InboxPage";
import { SentRecordsPage } from "./pages/SentRecordsPage";

function BackgroundSync() {
  const { pushToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function syncInbox(silent = false) {
      try {
        const data = await api("/api/automation/sync-inbox", {
          method: "POST",
          timeoutMs: 120000,
        });
        if (cancelled) {
          return;
        }
        if (!silent && data.new_replies?.length) {
          pushToast(`${data.new_replies.length} new repl${data.new_replies.length === 1 ? "y" : "ies"} detected`, "success");
        }
      } catch {
        // keep background polling quiet
      }
    }

    const firstRunId = window.setTimeout(() => syncInbox(true), 30000);
    const intervalId = window.setInterval(() => syncInbox(false), 120000);
    return () => {
      cancelled = true;
      window.clearTimeout(firstRunId);
      window.clearInterval(intervalId);
    };
  }, [pushToast]);

  return null;
}

export default function App() {
  return (
    <>
      <BackgroundSync />
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/datasets" element={<ContactsPage />} />
          <Route path="/templates" element={<ComposePage />} />
          <Route path="/logs" element={<InboxPage />} />
          <Route path="/sent-records" element={<SentRecordsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </>
  );
}
