import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Database,
  Inbox,
  Mail,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";

// Interactive Step 1: CSV Import Simulation
function DatasetImportDemo() {
  const [uploaded, setUploaded] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleUpload = () => {
    if (uploaded) {
      setUploaded(false);
      setParsing(false);
      return;
    }
    setUploaded(true);
    setTimeout(() => setParsing(true), 800);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 min-h-[320px] flex flex-col"
      style={{
        background: "linear-gradient(135deg, rgba(15, 15, 20, 0.95), rgba(20, 20, 30, 0.9))",
        border: "1px solid rgba(94, 234, 212, 0.15)",
        boxShadow: `0 12px 40px rgba(0, 0, 0, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)`,
      }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          EAOS — Datasets
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <AnimatePresence mode="wait">
          {!uploaded ? (
            <motion.div key="idle" className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
              <motion.div
                className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center relative"
                style={{ background: "linear-gradient(135deg, rgba(94, 234, 212, 0.15), rgba(6, 182, 212, 0.1))", border: "1px solid rgba(94, 234, 212, 0.25)" }}
                animate={{ boxShadow: ["0 0 20px rgba(94, 234, 212, 0.1)", "0 0 40px rgba(94, 234, 212, 0.2)", "0 0 20px rgba(94, 234, 212, 0.1)"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Upload className="h-8 w-8 text-teal-200" />
              </motion.div>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>Drop a CSV or click to upload</p>
              <motion.button onClick={handleUpload} className="px-6 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: "linear-gradient(135deg, rgba(94, 234, 212, 0.2), rgba(6, 182, 212, 0.15))", border: "1px solid rgba(94, 234, 212, 0.35)", color: "rgba(94, 234, 212, 0.95)" }} whileHover={{ scale: 1.015, boxShadow: "0 0 25px rgba(94, 234, 212, 0.2)" }} whileTap={{ scale: 0.98 }}>
                Upload CSV
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="uploaded" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-2 mb-5">
                <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: "#5EEAD4" }} animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                <span className="text-xs font-medium" style={{ color: "#5EEAD4" }}>Processing contacts</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: "File validated", delay: 0.2, width: "100%" },
                  { label: "Parsing 42 contacts", delay: 0.5, width: "85%" },
                  { label: "Deduplication check", delay: 0.8, width: "70%" },
                ].map((item) => (
                  <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: item.delay }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                      <motion.span className="text-xs font-mono" style={{ color: "#5EEAD4" }} initial={{ opacity: 0 }} animate={{ opacity: parsing ? 1 : 0 }} transition={{ delay: item.delay + 0.3 }}>Done</motion.span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #5EEAD4, #06B6D4)" }} initial={{ width: "0%" }} animate={{ width: parsing ? item.width : "0%" }} transition={{ duration: 1.2, delay: item.delay + 0.2, ease: "easeOut" }} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button onClick={handleUpload} className="mt-5 text-xs cursor-pointer px-4 py-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }} whileHover={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)" }}>
                Reset demo
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Interactive Step 2: AI Email Composer
function EmailComposerDemo() {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleToggle = () => {
    if (aiEnabled) {
      setAiEnabled(false);
      setGenerated(false);
      return;
    }
    setAiEnabled(true);
    setTimeout(() => setGenerated(true), 1200);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 min-h-[320px] flex flex-col"
      style={{
        background: "linear-gradient(135deg, rgba(15, 15, 20, 0.95), rgba(20, 20, 30, 0.9))",
        border: "1px solid rgba(94, 234, 212, 0.15)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>EAOS — Compose</span>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {/* Rough input */}
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>Your rough draft</div>
          <p className="text-xs font-mono" style={{ color: "rgba(245, 158, 11, 0.7)" }}>
            hi {"{"}<span style={{ color: "#F59E0B" }}>name</span>{"}"}, invite you to our product demo next week
          </p>
        </div>

        {/* AI toggle button */}
        <motion.button
          onClick={handleToggle}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
          style={{
            background: aiEnabled ? "rgba(94, 234, 212, 0.12)" : "rgba(255,255,255,0.04)",
            border: aiEnabled ? "1px solid rgba(94, 234, 212, 0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: aiEnabled ? "#5EEAD4" : "rgba(255,255,255,0.5)",
          }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{aiEnabled ? "AI refining..." : "Enable AI refinement"}</span>
        </motion.button>

        {/* AI output */}
        <AnimatePresence>
          {generated && (
            <motion.div
              className="rounded-xl p-3 flex-1"
              style={{ background: "rgba(34, 197, 94, 0.04)", border: "1px solid rgba(34, 197, 94, 0.2)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "rgba(34, 197, 94, 0.5)" }}>AI-polished output</div>
              <div className="text-xs mb-2" style={{ color: "rgba(34, 197, 94, 0.7)" }}>
                <span className="font-semibold">Subject:</span> You're invited — product demo next week
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Hi {"{"}<span style={{ color: "#22C55E" }}>name</span>{"}"}, I hope you're doing well. I'd love to invite you to an exclusive demo of our latest product next week. Would be great to have you there.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Interactive Step 3: Email Preview & Send
function PreviewSendDemo() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (sent) {
      setSending(false);
      setSent(false);
      return;
    }
    setSending(true);
    setTimeout(() => setSent(true), 2000);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 min-h-[320px] flex flex-col"
      style={{
        background: "linear-gradient(135deg, rgba(15, 15, 20, 0.95), rgba(20, 20, 30, 0.9))",
        border: "1px solid rgba(94, 234, 212, 0.15)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>EAOS — Preview</span>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Email preview card */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span className="font-medium">To:</span> Sarah Chen &lt;sarah@acmecorp.io&gt;
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              <span className="font-medium">Subject:</span> You're invited — product demo next week
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Hi <span style={{ color: "#5EEAD4" }}>Sarah</span>, I hope you're doing well. I'd love to invite you to an exclusive demo of our latest product next week...
            </p>
          </div>
        </div>

        {/* Send controls */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Recipients: 4 contacts</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Dataset: Q2 Outreach</span>
          </div>
        </div>

        {!sending ? (
          <motion.button onClick={handleSend} className="w-full px-4 py-3 rounded-xl text-sm font-medium cursor-pointer" style={{ background: "rgba(94, 234, 212, 0.12)", border: "1px solid rgba(94, 234, 212, 0.3)", color: "#5EEAD4" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <span className="inline-flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>Send after review</span>
            </span>
          </motion.button>
        ) : (
          <div className="space-y-2">
            {["Sarah Chen", "Raj Patel", "Emily Wong", "Alex Rivera"].map((name, i) => (
              <motion.div key={name} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}>
                <motion.div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)" }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.4 + 0.3, type: "spring" }}>
                  <Check className="h-2 w-2" style={{ color: "#22C55E" }} />
                </motion.div>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Sent to {name}</span>
              </motion.div>
            ))}
            {sent && (
              <motion.button onClick={handleSend} className="mt-3 text-xs cursor-pointer px-4 py-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Reset demo
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Interactive Step 4: Reply Inbox
function ReplyInboxDemo() {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    if (synced) {
      setSyncing(false);
      setSynced(false);
      return;
    }
    setSyncing(true);
    setTimeout(() => setSynced(true), 1500);
  };

  const replies = [
    { from: "Sarah Chen", preview: "This sounds really interesting! Can we do Thursday 2pm?", time: "2m ago" },
    { from: "Raj Patel", preview: "Sure, send me more details about the product.", time: "18m ago" },
  ];

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 min-h-[320px] flex flex-col"
      style={{
        background: "linear-gradient(135deg, rgba(15, 15, 20, 0.95), rgba(20, 20, 30, 0.9))",
        border: "1px solid rgba(94, 234, 212, 0.15)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>EAOS — Inbox</span>
      </div>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {!syncing ? (
            <motion.div key="idle" className="flex-1 flex flex-col items-center justify-center gap-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Inbox className="h-8 w-8" style={{ color: "rgba(94, 234, 212, 0.4)" }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Sync Gmail to check for replies from your contacts</p>
              <motion.button onClick={handleSync} className="px-6 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: "rgba(94, 234, 212, 0.15)", border: "1px solid rgba(94, 234, 212, 0.35)", color: "#5EEAD4" }} whileHover={{ scale: 1.015, boxShadow: "0 0 25px rgba(94, 234, 212, 0.2)" }} whileTap={{ scale: 0.98 }}>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Check inbox</span>
                </span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="synced" className="flex-1 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-4">
                <motion.div className="w-2 h-2 rounded-full" style={{ background: "#5EEAD4" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: synced ? 0 : Infinity }} />
                <span className="text-xs" style={{ color: "#5EEAD4" }}>{synced ? "2 new replies found" : "Syncing inbox..."}</span>
              </div>

              {synced && (
                <div className="space-y-3">
                  {replies.map((r, i) => (
                    <motion.div key={r.from} className="rounded-xl p-3" style={{ background: "rgba(94, 234, 212, 0.04)", border: "1px solid rgba(94, 234, 212, 0.15)" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.2 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{r.from}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{r.time}</span>
                      </div>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>"{r.preview}"</p>
                      <motion.div className="flex items-center gap-1 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.2 }}>
                        <Sparkles className="h-3 w-3" style={{ color: "#5EEAD4" }} />
                        <span className="text-[10px]" style={{ color: "rgba(94, 234, 212, 0.6)" }}>AI reply suggestion ready</span>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              )}

              {synced && (
                <motion.button onClick={handleSync} className="mt-auto text-xs cursor-pointer px-4 py-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Reset demo
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Interactive Step 5: Reply Approval Flow
function ReplyApprovalDemo() {
  const [step, setStep] = useState<"idle" | "suggesting" | "ready" | "sent">("idle");

  const handleSuggest = () => {
    setStep("suggesting");
    setTimeout(() => setStep("ready"), 1200);
  };

  const handleApprove = () => {
    setStep("sent");
  };

  const handleReset = () => {
    setStep("idle");
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 min-h-[320px] flex flex-col"
      style={{
        background: "linear-gradient(135deg, rgba(15, 15, 20, 0.95), rgba(20, 20, 30, 0.9))",
        border: "1px solid rgba(94, 234, 212, 0.15)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>EAOS — Reply Flow</span>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Original reply context */}
        <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>Incoming reply from Sarah Chen</div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            "This sounds really interesting! Can we do Thursday 2pm?"
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "idle" && (
            <motion.div key="idle" className="flex-1 flex flex-col items-center justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.button onClick={handleSuggest} className="px-6 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: "rgba(94, 234, 212, 0.15)", border: "1px solid rgba(94, 234, 212, 0.35)", color: "#5EEAD4" }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Suggest reply</span>
                </span>
              </motion.button>
            </motion.div>
          )}

          {step === "suggesting" && (
            <motion.div key="suggesting" className="flex-1 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2">
                <motion.div className="w-2 h-2 rounded-full" style={{ background: "#5EEAD4" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                <span className="text-xs" style={{ color: "#5EEAD4" }}>Generating context-aware reply...</span>
              </div>
            </motion.div>
          )}

          {(step === "ready" || step === "sent") && (
            <motion.div key="ready" className="flex-1 flex flex-col gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl p-3" style={{ background: step === "sent" ? "rgba(34, 197, 94, 0.06)" : "rgba(94, 234, 212, 0.04)", border: `1px solid ${step === "sent" ? "rgba(34, 197, 94, 0.2)" : "rgba(94, 234, 212, 0.15)"}` }}>
                <div className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: step === "sent" ? "rgba(34, 197, 94, 0.5)" : "rgba(94, 234, 212, 0.4)" }}>
                  {step === "sent" ? "✓ Sent" : "AI-suggested reply"}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Hi Sarah, Thursday 2pm works perfectly! I'll send over a calendar invite shortly. Looking forward to showing you what we've built.
                </p>
              </div>

              {step === "ready" && (
                <motion.button onClick={handleApprove} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#22C55E" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Approve and send</span>
                  </span>
                </motion.button>
              )}

              {step === "sent" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs" style={{ color: "rgba(34, 197, 94, 0.7)" }}>Reply sent — thread removed from pending queue</span>
                  </div>
                  <button onClick={handleReset} className="text-xs cursor-pointer px-4 py-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    Reset demo
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const steps = [
  {
    number: "01",
    title: "Import your contacts from a CSV",
    description: "Upload an investor list, guest list, lead CSV, or alumni database. EAOS parses, deduplicates, and stores contacts in named datasets.",
    interactive: "import",
  },
  {
    number: "02",
    title: "Compose with AI refinement",
    description: "Write a rough email body like 'hi {name}, wanted to show you our product'. Enable AI to generate a polished version with auto-generated subject line.",
    interactive: "compose",
  },
  {
    number: "03",
    title: "Preview and send to your dataset",
    description: "Review the final email with placeholders resolved for each contact. Click 'Send after review' to deliver to all or selected recipients.",
    interactive: "preview",
  },
  {
    number: "04",
    title: "Sync inbox and catch replies",
    description: "EAOS syncs your Gmail inbox via IMAP, matches replies to sent threads, and surfaces only conversations that need your attention.",
    interactive: "inbox",
  },
  {
    number: "05",
    title: "Approve AI-suggested replies",
    description: "For each reply, EAOS generates a context-aware response using the full thread. Review, edit if needed, and approve before sending.",
    interactive: "approval",
  },
];

export function HowItWorks() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24">
      {/* Section header */}
      <motion.div
        className="text-center mb-20"
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2
          className="text-3xl md:text-4xl font-semibold mb-4"
          style={{
            color: "var(--color-foreground)",
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
          }}
        >
          How it Works
        </h2>
        <p
          className="text-lg max-w-2xl mx-auto"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          From first email to final reply — five steps to streamlined outreach
        </p>
      </motion.div>

      {/* Steps */}
      <div className="space-y-16">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.42, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Left side - Content */}
              <div className="flex-1 lg:text-left text-center">
                {/* Step number with glow */}
                <div className="relative inline-block mb-6">
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: "radial-gradient(circle, rgba(161, 134, 111, 0.2), transparent 70%)",
                      filter: "blur(20px)",
                      transform: "scale(1.5)",
                    }}
                    animate={{ opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div
                    className="relative px-5 py-2 rounded-xl font-semibold text-sm tracking-wider"
                    style={{
                      background: "linear-gradient(135deg, rgba(139, 111, 71, 0.15), rgba(161, 134, 111, 0.1))",
                      border: "1px solid rgba(161, 134, 111, 0.3)",
                      color: "var(--color-foreground)",
                      boxShadow: `0 4px 12px rgba(139, 111, 71, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.4)`,
                    }}
                  >
                    STEP {step.number}
                  </div>
                </div>

                <h3
                  className="text-2xl md:text-3xl font-semibold mb-4"
                  style={{ color: "var(--color-foreground)", letterSpacing: "-0.01em" }}
                >
                  {step.title}
                </h3>

                <p
                  className="text-base md:text-lg leading-relaxed max-w-lg lg:mx-0 mx-auto"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {step.description}
                </p>
              </div>

              {/* Right side - Interactive Element */}
              <div className="flex-1 w-full">
                <motion.div
                  className="relative group"
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="absolute inset-0 translate-y-4 rounded-2xl" style={{ background: "rgba(94, 234, 212, 0.03)" }} />
                  <motion.div
                    className="absolute inset-0 rounded-2xl -z-10 pointer-events-none opacity-0 group-hover:opacity-100"
                    style={{ background: "radial-gradient(ellipse at center, rgba(94, 234, 212, 0.08), transparent 70%)" }}
                    transition={{ duration: 0.4 }}
                  />

                  {step.interactive === "import" && <DatasetImportDemo />}
                  {step.interactive === "compose" && <EmailComposerDemo />}
                  {step.interactive === "preview" && <PreviewSendDemo />}
                  {step.interactive === "inbox" && <ReplyInboxDemo />}
                  {step.interactive === "approval" && <ReplyApprovalDemo />}
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
