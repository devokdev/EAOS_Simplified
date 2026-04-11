import React from 'react';
import {
  Brain,
  Database,
  Mail,
  MessageSquare,
  Shield,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  MOTION_DURATION,
  MOTION_STAGGER,
  enterTransition,
  revealUp,
  smoothTransition,
} from "../lib/motion";

type FeatureTone = {
  beam: string;
  ring: string;
  glow: string;
  chip: string;
  border: string;
};

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  layout: string;
  tone: FeatureTone;
};

const featureCards: FeatureCard[] = [
  {
    icon: Database,
    title: "Dataset-Based Contacts",
    description: "Import CSV contact lists, browse members, remove entries, or wipe datasets. Manage outreach at scale.",
    badge: "Data Layer",
    layout: "md:col-span-2 lg:col-span-7",
    tone: {
      beam: "rgba(94, 234, 212, 0.18)",
      ring: "rgba(45, 212, 191, 0.13)",
      glow: "rgba(45, 212, 191, 0.22)",
      chip: "#99F6E4",
      border: "rgba(94, 234, 212, 0.38)",
    },
  },
  {
    icon: Brain,
    title: "AI Email Composer",
    description: "Write a rough draft and let AI turn it into a polished, send-ready email with generated subjects.",
    badge: "AI Engine",
    layout: "md:col-span-1 lg:col-span-5",
    tone: {
      beam: "rgba(56, 189, 248, 0.16)",
      ring: "rgba(14, 165, 233, 0.12)",
      glow: "rgba(14, 165, 233, 0.2)",
      chip: "#7DD3FC",
      border: "rgba(56, 189, 248, 0.34)",
    },
  },
  {
    icon: Mail,
    title: "Gmail Inbox Sync",
    description: "Automatically detect and capture replies from contacts already in your datasets via IMAP.",
    badge: "Sync Engine",
    layout: "md:col-span-1 lg:col-span-4",
    tone: {
      beam: "rgba(125, 211, 252, 0.14)",
      ring: "rgba(56, 189, 248, 0.1)",
      glow: "rgba(56, 189, 248, 0.18)",
      chip: "#BAE6FD",
      border: "rgba(125, 211, 252, 0.32)",
    },
  },
  {
    icon: MessageSquare,
    title: "Thread-Aware Reply Suggestions",
    description:
      "AI generates context-aware response drafts using the full conversation thread — not just isolated messages.",
    badge: "Smart Reply",
    layout: "md:col-span-1 lg:col-span-8",
    tone: {
      beam: "rgba(94, 234, 212, 0.14)",
      ring: "rgba(34, 211, 238, 0.1)",
      glow: "rgba(34, 211, 238, 0.18)",
      chip: "#67E8F9",
      border: "rgba(34, 211, 238, 0.32)",
    },
  },
  {
    icon: Shield,
    title: "Approval-First Automation",
    description: "Every reply is reviewed before sending. No blind autoresponders — you stay in control.",
    badge: "Trust Layer",
    layout: "md:col-span-1 lg:col-span-5",
    tone: {
      beam: "rgba(148, 163, 184, 0.16)",
      ring: "rgba(100, 116, 139, 0.12)",
      glow: "rgba(71, 85, 105, 0.2)",
      chip: "#CBD5E1",
      border: "rgba(148, 163, 184, 0.3)",
    },
  },
  {
    icon: BarChart3,
    title: "Sent Records & Reply Tracking",
    description:
      "Lightweight CRM-style view showing every sent thread with total replies, pending counts, and action status.",
    badge: "Analytics",
    layout: "md:col-span-2 lg:col-span-7",
    tone: {
      beam: "rgba(94, 234, 212, 0.18)",
      ring: "rgba(45, 212, 191, 0.12)",
      glow: "rgba(16, 185, 129, 0.2)",
      chip: "#6EE7B7",
      border: "rgba(110, 231, 183, 0.34)",
    },
  },
];

interface BuildCardProps {
  key?: string;
  card: FeatureCard;
  index: number;
  disableAdvancedAnimations: boolean;
}

function BuildCard({ card, index, disableAdvancedAnimations }: BuildCardProps) {
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  const rotateX = useTransform(tiltY, [-0.5, 0.5], [3.2, -3.2]);
  const rotateY = useTransform(tiltX, [-0.5, 0.5], [-4.5, 4.5]);
  const parallaxX = useTransform(tiltX, [-0.5, 0.5], [-14, 14]);
  const parallaxY = useTransform(tiltY, [-0.5, 0.5], [-12, 12]);
  const orbitX = useTransform(tiltX, [-0.5, 0.5], [-18, 18]);

  const pointerBeam = useMotionTemplate`radial-gradient(260px circle at ${pointerX}% ${pointerY}%, ${card.tone.beam} 0%, transparent 72%)`;
  const pointerRing = useMotionTemplate`radial-gradient(560px circle at ${pointerX}% ${pointerY}%, ${card.tone.ring} 0%, transparent 80%)`;

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (disableAdvancedAnimations) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = (event.clientX - rect.left) / rect.width;
    const localY = (event.clientY - rect.top) / rect.height;
    pointerX.set(localX * 100);
    pointerY.set(localY * 100);
    tiltX.set(localX - 0.5);
    tiltY.set(localY - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(50);
    pointerY.set(50);
    tiltX.set(0);
    tiltY.set(0);
  };

  const Icon = card.icon;

  return (
    <motion.article
      {...revealUp({
        delay: index * MOTION_STAGGER.tight,
        distance: 12,
        duration: MOTION_DURATION.medium,
      })}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      whileHover={disableAdvancedAnimations ? undefined : { y: -3, scale: 1.008 }}
      transition={smoothTransition()}
      className={`group relative min-h-[240px] overflow-hidden rounded-[26px] border p-6 md:p-7 ${card.layout}`}
      style={{
        background:
          "linear-gradient(148deg, rgba(8, 14, 24, 0.95), rgba(12, 20, 34, 0.92) 45%, rgba(9, 16, 28, 0.96))",
        borderColor: "rgba(148, 163, 184, 0.2)",
        boxShadow: "0 14px 26px rgba(2, 8, 16, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        transformStyle: "preserve-3d",
        rotateX: disableAdvancedAnimations ? 0 : rotateX,
        rotateY: disableAdvancedAnimations ? 0 : rotateY,
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: pointerRing, opacity: 0.86 }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: pointerBeam, opacity: 0.92 }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-[0.8]"
        style={{
          background:
            "linear-gradient(112deg, transparent 35%, rgba(255,255,255,0.06) 49%, transparent 60%)",
          backgroundSize: "220% 100%",
        }}
        animate={
          disableAdvancedAnimations
            ? undefined
            : {
                backgroundPosition: ["-120% 0%", "220% 0%"],
              }
        }
        transition={{
          duration: 2.8,
          delay: 3 + index * 0.4,
          repeat: Infinity,
          repeatDelay: 8.8,
          ease: [0.4, 0, 0.2, 1],
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-7 flex items-center justify-between">
          <motion.div
            className="relative flex h-12 w-12 items-center justify-center rounded-xl border"
            style={{
              background:
                "linear-gradient(140deg, rgba(15, 23, 42, 0.74), rgba(7, 14, 27, 0.9))",
              borderColor: card.tone.border,
              boxShadow: "0 10px 20px rgba(2, 8, 16, 0.35)",
              x: disableAdvancedAnimations ? 0 : parallaxX,
              y: disableAdvancedAnimations ? 0 : parallaxY,
            }}
            transition={smoothTransition()}
          >
            <Icon className="h-5 w-5" style={{ color: card.tone.chip }} />
          </motion.div>

          <span
            className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{
              color: card.tone.chip,
              borderColor: card.tone.border,
              background: "rgba(15, 23, 42, 0.42)",
            }}
          >
            {card.badge}
          </span>
        </div>

        <h3
          className="max-w-[26ch] text-xl font-semibold leading-tight"
          style={{
            color: "rgba(241, 245, 249, 0.97)",
            letterSpacing: "-0.018em",
          }}
        >
          {card.title}
        </h3>

        <p
          className="mt-3 max-w-[44ch] text-sm leading-relaxed"
          style={{ color: "rgba(203, 213, 225, 0.86)" }}
        >
          {card.description}
        </p>

        <div className="mt-auto pt-6">
          <div className="mb-3 h-px w-full" style={{ background: "rgba(148, 163, 184, 0.18)" }} />
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: card.tone.chip }}
            />
            <span
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "rgba(203, 213, 225, 0.7)" }}
            >
              Production Ready
            </span>
          </div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full"
        style={{
          background: card.tone.glow,
          opacity: 0.34,
          x: disableAdvancedAnimations ? 0 : orbitX,
        }}
        transition={smoothTransition()}
      />
    </motion.article>
  );
}

export function FeatureCards() {
  const prefersReducedMotion = useReducedMotion();
  const disableAdvancedAnimations = Boolean(prefersReducedMotion);

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-24">
      <motion.div className="text-center mb-8" {...revealUp({ distance: 14 })}>
        <h2
          className="text-3xl md:text-4xl font-semibold mb-4"
          style={{
            color: "var(--color-foreground)",
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
          }}
        >
          Built for Outbound Teams
        </h2>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-muted-foreground)" }}>
          A complete email operations workspace — from first send to final reply
        </p>
      </motion.div>

      <div className="section-divider-fade mx-auto mb-12 max-w-5xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-fr">
        {featureCards.map((card, index) => (
          <BuildCard
            key={card.title}
            card={card}
            index={index}
            disableAdvancedAnimations={disableAdvancedAnimations}
          />
        ))}
      </div>
    </section>
  );
}
