import { motion } from "motion/react";
import { useEffect, useState } from "react";

const codeLines = [
  "async function syncInbox(userId: string) {",
  "  const replies = await gmail.fetchReplies(userId);",
  "  const matched = replies.filter(r => datasets.has(r.from));",
  "  return matched.map(r => createThread(r));",
  "}",
  "",
  "interface EmailTemplate {",
  "  subject: string;",
  "  body: string;",
  "  placeholders: Map<string, string>;",
  "}",
  "",
  "const refineWithAI = async (draft: string): Promise<EmailTemplate> => {",
  "  const result = await gemini.generate({ prompt: draft });",
  "  return { subject: result.subject, body: result.body, placeholders: result.vars };",
  "};",
];

export function CodeBackground() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev.length >= codeLines.length) return [];
        return [...prev, prev.length];
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="absolute top-1/4 left-[5%] w-[90%] max-w-3xl">
        {codeLines.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={
              visibleLines.includes(index)
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: -20 }
            }
            transition={{ duration: 0.3 }}
            className="font-mono text-sm mb-1"
            style={{
              color: line.includes("function") || line.includes("class") || line.includes("const") || line.includes("interface")
                ? "rgba(139, 92, 246, 0.6)"
                : "rgba(99, 102, 241, 0.4)",
            }}
          >
            {line || "\u00A0"}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
