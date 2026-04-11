import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  Mail,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  MOTION_DURATION,
  ambientLoop,
  enterTransition,
  smoothTransition,
} from "../lib/motion";

const demoSteps = [
  { id: "import", label: "Import", icon: Upload },
  { id: "compose", label: "Compose", icon: Mail },
  { id: "preview", label: "Preview", icon: Send },
  { id: "replies", label: "Replies", icon: MessageSquare },
];

const sampleContacts = [
  { name: "Sarah Chen", email: "sarah@acmecorp.io", company: "Acme Corp" },
  { name: "Raj Patel", email: "raj@startupco.com", company: "StartupCo" },
  { name: "Emily Wong", email: "emily@techfirm.dev", company: "TechFirm" },
  { name: "Alex Rivera", email: "alex@venturelabs.io", company: "VentureLabs" },
];

export function LiveDemo() {
  const prefersReducedMotion = useReducedMotion();
  const disableAdvancedAnimations = Boolean(prefersReducedMotion);
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 3));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Demo container */}
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(10, 10, 18, 0.98), rgba(15, 15, 25, 0.95))",
          border: "1px solid rgba(94, 234, 212, 0.12)",
          boxShadow: `
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 8px 24px rgba(0, 0, 0, 0.3),
            0 0 80px rgba(94, 234, 212, 0.04)
          `,
        }}
      >
        {/* Window titlebar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <span className="text-xs ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              EAOS — Live Demo
            </span>
          </div>

          {/* Step progress dots */}
          <div className="flex items-center gap-1.5">
            {demoSteps.map((step, i) => (
              <motion.button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer"
                style={{
                  background: i === currentStep ? "rgba(94, 234, 212, 0.12)" : "transparent",
                  border: i === currentStep ? "1px solid rgba(94, 234, 212, 0.25)" : "1px solid transparent",
                }}
                whileTap={{ scale: 0.98 }}
                transition={smoothTransition(0, MOTION_DURATION.short)}
              >
                <step.icon className="h-3 w-3" />
                <span
                  className="text-[10px] font-medium hidden sm:inline"
                  style={{ color: i === currentStep ? "#5EEAD4" : i < currentStep ? "rgba(94, 234, 212, 0.5)" : "rgba(255,255,255,0.25)" }}
                >
                  {step.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="p-6 md:p-8 min-h-[360px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 1: Import Dataset */}
            {currentStep === 0 && (
              <motion.div
                key="import"
                className="flex-1 flex flex-col"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={enterTransition(0, MOTION_DURATION.medium)}
              >
                <h3 className="text-lg font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Import Your Contacts
                </h3>
                <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Upload a CSV with your target contacts — investors, leads, event guests, or alumni
                </p>

                {/* Upload zone */}
                <motion.div
                  className="rounded-xl p-5 mb-4 flex items-center justify-center gap-3"
                  style={{
                    background: "rgba(94, 234, 212, 0.04)",
                    border: "2px dashed rgba(94, 234, 212, 0.2)",
                  }}
                  animate={{
                    borderColor: ["rgba(94, 234, 212, 0.15)", "rgba(94, 234, 212, 0.3)", "rgba(94, 234, 212, 0.15)"],
                  }}
                  transition={disableAdvancedAnimations ? undefined : ambientLoop(4)}
                >
                  <Database className="h-5 w-5" style={{ color: "#5EEAD4" }} />
                  <span className="text-sm" style={{ color: "rgba(94, 234, 212, 0.7)" }}>
                    contacts_q2_outreach.csv uploaded
                  </span>
                  <Check className="h-4 w-4" style={{ color: "#22C55E" }} />
                </motion.div>

                {/* Contact preview table */}
                <div className="rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="grid grid-cols-3 gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span>Name</span>
                    <span>Email</span>
                    <span>Company</span>
                  </div>
                  {sampleContacts.map((c, i) => (
                    <motion.div
                      key={c.email}
                      className="grid grid-cols-3 gap-4 px-4 py-2.5"
                      style={{ borderBottom: i < sampleContacts.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{c.name}</span>
                      <span className="text-xs font-mono" style={{ color: "rgba(94, 234, 212, 0.6)" }}>{c.email}</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{c.company}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="flex items-center gap-2 mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>4 contacts loaded into dataset</span>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Compose with AI */}
            {currentStep === 1 && (
              <motion.div
                key="compose"
                className="flex-1 flex flex-col"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={enterTransition(0, MOTION_DURATION.medium)}
              >
                <h3 className="text-lg font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Compose with AI
                </h3>
                <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Write a rough draft — EAOS turns it into a polished, send-ready email
                </p>

                {/* Rough input */}
                <div className="mb-4">
                  <div className="text-[11px] uppercase tracking-wider mb-2 font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Your rough draft
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                    <p className="text-sm font-mono leading-relaxed" style={{ color: "rgba(245, 158, 11, 0.8)" }}>
                      hi {"{"}<span style={{ color: "#F59E0B" }}>name</span>{"}"}, wanted to show you what we are building at eaos. would love to chat sometime this week
                    </p>
                  </div>
                </div>

                {/* AI toggle */}
                <motion.div
                  className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(94, 234, 212, 0.08)", border: "1px solid rgba(94, 234, 212, 0.2)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "#5EEAD4" }} />
                  <span className="text-xs" style={{ color: "#5EEAD4" }}>AI refinement enabled — generating polished version...</span>
                </motion.div>

                {/* AI output */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-[11px] uppercase tracking-wider mb-2 font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
                    AI-refined output
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(34, 197, 94, 0.06)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                    <div className="text-xs mb-2" style={{ color: "rgba(34, 197, 94, 0.7)" }}>
                      <span className="font-semibold">Subject:</span> Quick intro — what we're building at EAOS
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                      Hi {"{"}<span style={{ color: "#22C55E" }}>name</span>{"}"}, <br /><br />
                      I hope this message finds you well. I wanted to reach out and share what we've been building at EAOS — an AI-assisted email operations workspace for outbound teams. <br /><br />
                      Would love to find a few minutes this week to walk you through a quick demo.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Preview & Send */}
            {currentStep === 2 && (
              <motion.div
                key="preview"
                className="flex-1 flex flex-col"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={enterTransition(0, MOTION_DURATION.medium)}
              >
                <h3 className="text-lg font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Preview & Send
                </h3>
                <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Review the final email with placeholders resolved, then send to your dataset
                </p>

                {/* Email preview card */}
                <div className="rounded-xl overflow-hidden mb-4" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>To: Sarah Chen &lt;sarah@acmecorp.io&gt;</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Subject: Quick intro — what we're building at EAOS</div>
                    </div>
                    <Mail className="h-4 w-4" style={{ color: "rgba(94, 234, 212, 0.5)" }} />
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                      Hi <span style={{ color: "#5EEAD4" }}>Sarah</span>,<br /><br />
                      I hope this message finds you well. I wanted to reach out and share what we've been building at EAOS — an AI-assisted email operations workspace for outbound teams.<br /><br />
                      Would love to find a few minutes this week to walk you through a quick demo.
                    </p>
                  </div>
                </div>

                {/* Send progress */}
                <div className="space-y-2">
                  {sampleContacts.map((c, i) => (
                    <motion.div
                      key={c.email}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.2 }}
                    >
                      <motion.div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)" }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.2, type: "spring" }}
                      >
                        <Check className="h-2.5 w-2.5" style={{ color: "#22C55E" }} />
                      </motion.div>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Sent to {c.name}</span>
                      <span className="text-[10px] font-mono ml-auto" style={{ color: "rgba(34, 197, 94, 0.5)" }}>✓ delivered</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Track Replies */}
            {currentStep === 3 && (
              <motion.div
                key="replies"
                className="flex-1 flex flex-col"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={enterTransition(0, MOTION_DURATION.medium)}
              >
                <h3 className="text-lg font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Track Replies & Suggest Responses
                </h3>
                <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Inbox syncs replies from known contacts — AI drafts context-aware responses
                </p>

                {/* Reply threads */}
                <div className="space-y-3">
                  {[
                    { from: "Sarah Chen", reply: "This sounds really interesting! Can we do Thursday 2pm?", status: "pending", time: "2m ago" },
                    { from: "Raj Patel", reply: "Sure, send me more details about the product.", status: "pending", time: "18m ago" },
                    { from: "Emily Wong", reply: "Thanks for reaching out. I'll pass this to our head of growth.", status: "replied", time: "1h ago" },
                  ].map((thread, i) => (
                    <motion.div
                      key={thread.from}
                      className="rounded-xl p-4"
                      style={{
                        background: thread.status === "pending" ? "rgba(94, 234, 212, 0.04)" : "rgba(255,255,255,0.02)",
                        border: thread.status === "pending" ? "1px solid rgba(94, 234, 212, 0.15)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{thread.from}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{thread.time}</span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: thread.status === "pending" ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)",
                              color: thread.status === "pending" ? "#F59E0B" : "#22C55E",
                              border: `1px solid ${thread.status === "pending" ? "rgba(245, 158, 11, 0.25)" : "rgba(34, 197, 94, 0.25)"}`,
                            }}
                          >
                            {thread.status === "pending" ? "Needs reply" : "Replied"}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                        "{thread.reply}"
                      </p>
                      {thread.status === "pending" && (
                        <motion.div
                          className="flex items-center gap-1.5 mt-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 + i * 0.15 }}
                        >
                          <Sparkles className="h-3 w-3" style={{ color: "#5EEAD4" }} />
                          <span className="text-[11px]" style={{ color: "rgba(94, 234, 212, 0.6)" }}>AI reply suggestion ready</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom navigation bar */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <motion.button
            onClick={goBack}
            className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer inline-flex items-center gap-1.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
              opacity: currentStep === 0 ? 0.3 : 1,
              pointerEvents: currentStep === 0 ? "none" : "auto",
            }}
            whileHover={{
              background: "rgba(255,255,255,0.08)",
              y: disableAdvancedAnimations ? 0 : -2,
            }}
            whileTap={{ scale: 0.98 }}
            transition={smoothTransition()}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </motion.button>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {demoSteps.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: i === currentStep ? 20 : 6,
                  height: 6,
                  background: i === currentStep
                    ? "linear-gradient(90deg, #5EEAD4, #06B6D4)"
                    : i < currentStep
                      ? "rgba(94, 234, 212, 0.4)"
                      : "rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          <motion.button
            onClick={currentStep < 3 ? goNext : () => setCurrentStep(0)}
            className="px-5 py-2 rounded-xl text-xs font-medium cursor-pointer inline-flex items-center gap-1.5"
            style={{
              background: "rgba(94, 234, 212, 0.12)",
              border: "1px solid rgba(94, 234, 212, 0.3)",
              color: "#5EEAD4",
            }}
            whileHover={{
              boxShadow: "0 0 20px rgba(94, 234, 212, 0.15)",
              y: disableAdvancedAnimations ? 0 : -2,
            }}
            whileTap={{ scale: 0.98 }}
            transition={smoothTransition()}
          >
            {currentStep < 3 ? (
              <>
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Replay</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
