import React from 'react';
import { useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import {
    Sparkles,
    Rocket,
    Eye,
    Mail,
    Brain,
    TrendingUp,
    Users,
    MessageSquare,
    BarChart3,
    Zap,
    Globe,
    Target,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Shared Glassmorphism Card Wrapper
   ───────────────────────────────────────────── */
function GlassCard({
    children,
    className = "",
    hover = true,
}: {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-150, 150], [4, -4]);
    const rotateY = useTransform(x, [-150, 150], [-4, 4]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!hover) return;
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            className={`relative rounded-2xl overflow-hidden ${className}`}
            style={{
                background:
                    "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                backdropFilter: "blur(40px)",
                border: "1px solid rgba(161, 134, 111, 0.18)",
                boxShadow: `
          0 12px 40px rgba(0, 0, 0, 0.35),
          0 5px 15px rgba(0, 0, 0, 0.25),
          inset 0 1px 1px rgba(255, 255, 255, 0.04)
        `,
                perspective: 800,
                rotateX: hover ? rotateX : 0,
                rotateY: hover ? rotateY : 0,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={
                hover
                    ? {
                        borderColor: "rgba(94, 234, 212, 0.25)",
                        boxShadow: `
              0 18px 50px rgba(99,82,61,0.18),
              0 8px 30px rgba(99,82,61,0.12),
              inset 0 1px 1px rgba(255,255,255,0.06)
            `,
                    }
                    : undefined
            }
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            {/* Top light reflection */}
            <div
                className="absolute top-0 left-0 right-0 h-24 rounded-t-2xl pointer-events-none"
                style={{
                    background:
                        "linear-gradient(to bottom, rgba(255,255,255,0.04), transparent)",
                }}
            />
            {children}
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   1️⃣  Hero Statement
   ───────────────────────────────────────────── */
function HeroStatement() {
    return (
        <motion.div
            className="text-center mb-20 relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: "easeOut" }}
        >
            {/* Decorative ambient glow */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse, rgba(94, 234, 212, 0.08), transparent 70%)",
                    filter: "blur(60px)",
                }}
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Section label */}
            <motion.div
                className="inline-block px-5 py-2 rounded-full mb-8"
                style={{
                    background:
                        "linear-gradient(135deg, rgba(94, 234, 212, 0.1), rgba(6, 182, 212, 0.05))",
                    border: "1px solid rgba(94, 234, 212, 0.2)",
                }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                <span
                    className="text-xs font-semibold tracking-widest uppercase"
                    style={{ color: "#5EEAD4" }}
                >
                    Use Cases
                </span>
            </motion.div>

            {/* Main heading */}
            <motion.h2
                className="relative mb-6"
                style={{
                    fontSize: "clamp(2rem, 5vw, 3.8rem)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: "-0.03em",
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
            >
                {["Redefining", "How", "Teams", "Handle", "Outbound", "Email."].map(
                    (word, i) => (
                        <motion.span
                            key={word}
                            className="inline-block mr-[0.25em]"
                            initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.25 + i * 0.08, ease: "easeOut" }}
                            style={
                                word === "Outbound"
                                    ? {
                                        background:
                                            "linear-gradient(135deg, #5EEAD4, #06B6D4, #67E8F9)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                    }
                                    : { color: "rgba(255,255,255,0.95)" }
                            }
                        >
                            {word}
                        </motion.span>
                    )
                )}

                {/* Shimmer sweep */}
                <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(105deg, transparent 40%, rgba(94,234,212,0.1) 50%, transparent 60%)",
                        backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["-100% 0%", "200% 0%"] }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 5,
                        ease: "easeInOut",
                    }}
                />
            </motion.h2>

            {/* Subtitle */}
            <motion.p
                className="text-lg md:text-xl max-w-2xl mx-auto"
                style={{ color: "var(--color-muted-foreground)", lineHeight: 1.8 }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.5 }}
            >
                EAOS is built for real workflows where teams send the first email,
                wait for replies, and need fast follow-up without losing context.
            </motion.p>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   2️⃣  Real-World Use Cases
   ───────────────────────────────────────────── */
function UseCasesSection() {
    const cases = [
        {
            title: "Startup Founder Outreach",
            description: "Upload an investor, customer, or partner list. Write a rough email, let AI polish it. Send in batches, then review replies in one queue.",
            icon: Rocket,
        },
        {
            title: "College Fest & Event Invitations",
            description: "Import a guest list, write a short note, generate a full email with placeholders preserved. Track who replied and how many times.",
            icon: Users,
        },
        {
            title: "Agency Lead Follow-Up",
            description: "Send cold outreach to leads from a CSV. Use the replies page to see open conversations only. Replied threads leave the pending queue.",
            icon: Target,
        },
        {
            title: "Alumni & Placement Communication",
            description: "Send internship or mentorship invites. When someone replies with a short message, EAOS captures it and generates a context-aware draft.",
            icon: MessageSquare,
        },
        {
            title: "Internal Ops & Community Management",
            description: "Use the sent records tab to keep a clean view of every sent thread, total replies received, and pending inbound messages.",
            icon: BarChart3,
        },
    ];

    return (
        <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
        >
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Left column — heading */}
                <motion.div
                    className="lg:w-5/12 lg:sticky lg:top-32"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <h3
                        className="text-2xl md:text-3xl font-bold mb-4"
                        style={{
                            color: "var(--color-foreground)",
                            fontFamily: "var(--font-display)",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Real-World Use Cases
                    </h3>
                    <motion.div
                        className="h-1 rounded-full w-12 mb-5"
                        style={{
                            background: "linear-gradient(90deg, #5EEAD4, rgba(6, 182, 212, 0.3))",
                        }}
                        initial={{ scaleX: 0, originX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    />
                    <p
                        className="text-base leading-relaxed"
                        style={{ color: "var(--color-muted-foreground)" }}
                    >
                        From startup outreach to college invitations, EAOS handles the entire
                        lifecycle — first email, reply tracking, and smart follow-up — without
                        needing a full CRM.
                    </p>
                </motion.div>

                {/* Right column — use case cards */}
                <div className="lg:w-7/12 space-y-4">
                    {cases.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: "easeOut" }}
                        >
                            <GlassCard className="p-5 group" hover={false}>
                                <motion.div
                                    className="flex items-start gap-4"
                                    whileHover={{ x: 6 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, rgba(94, 234, 212, 0.1), rgba(6, 182, 212, 0.05))",
                                            border: "1px solid rgba(94, 234, 212, 0.15)",
                                        }}
                                    >
                                        <item.icon className="h-4 w-4 text-teal-200" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                                            {item.title}
                                        </h4>
                                        <p
                                            className="text-sm leading-relaxed"
                                            style={{ color: "var(--color-muted-foreground)" }}
                                        >
                                            {item.description}
                                        </p>
                                    </div>
                                </motion.div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   3.  What Makes EAOS Impressive
   ───────────────────────────────────────────── */
function WhyEAOS() {
    const [revealed, setRevealed] = useState(false);

    const points = [
        "AI can turn rough notes into a send-ready email before preview.",
        "Subject is optional — EAOS can generate it from intent.",
        "Placeholders like {name} and {email} are preserved during AI refinement.",
        "Reply suggestions use the full conversation thread, not isolated messages.",
        "The inbox queue only shows threads that still need your attention.",
        "Once you reply, the thread leaves the pending queue until the recipient replies again.",
    ];

    return (
        <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            onViewportEnter={() => setRevealed(true)}
        >
            <GlassCard className="p-8 md:p-12">
                <div className="relative flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                    <div className="md:min-w-[200px] shrink-0">
                        <motion.h3
                            className="text-2xl md:text-3xl font-bold mb-2"
                            style={{
                                color: "var(--color-foreground)",
                                fontFamily: "var(--font-display)",
                                letterSpacing: "-0.02em",
                            }}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                        >
                            What Makes EAOS Different
                        </motion.h3>
                        <motion.div
                            className="h-1 rounded-full w-12"
                            style={{
                                background: "linear-gradient(90deg, #5EEAD4, rgba(6, 182, 212, 0.3))",
                            }}
                            initial={{ scaleX: 0, originX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        />
                    </div>

                    <div className="flex-1 space-y-4">
                        {points.map((point, i) => (
                            <motion.div
                                key={i}
                                className="flex items-start gap-3"
                                initial={{ opacity: 0, x: -15 }}
                                animate={revealed ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                            >
                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(94, 234, 212, 0.12)", border: "1px solid rgba(94, 234, 212, 0.25)" }}>
                                    <Sparkles className="h-3 w-3" style={{ color: "#5EEAD4" }} />
                                </div>
                                <p className="text-sm md:text-base leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                                    {point}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   4.  Our Mission
   ───────────────────────────────────────────── */
function OurMission() {
    return (
        <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
        >
            <div className="relative overflow-hidden rounded-2xl p-10 md:p-14 text-center">
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        background: `
              linear-gradient(135deg, 
                rgba(94, 234, 212, 0.15), 
                rgba(6, 182, 212, 0.08), 
                rgba(161, 134, 111, 0.1), 
                rgba(94, 234, 212, 0.12)
              )`,
                        backgroundSize: "300% 300%",
                    }}
                    animate={{
                        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />

                <div
                    className="relative rounded-2xl p-10 md:p-14"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(10, 10, 14, 0.95), rgba(15, 15, 22, 0.9))",
                        border: "1px solid rgba(94, 234, 212, 0.12)",
                    }}
                >
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(ellipse, rgba(94, 234, 212, 0.06), transparent 70%)",
                            filter: "blur(50px)",
                        }}
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <motion.h3
                        className="relative text-2xl md:text-3xl font-bold mb-6"
                        style={{
                            color: "var(--color-foreground)",
                            fontFamily: "var(--font-display)",
                            letterSpacing: "-0.02em",
                        }}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        Our Mission
                    </motion.h3>

                    <motion.div
                        className="h-1 rounded-full w-16 mx-auto mb-8"
                        style={{
                            background: "linear-gradient(90deg, transparent, #5EEAD4, transparent)",
                        }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    />

                    <motion.p
                        className="relative text-xl md:text-2xl font-medium leading-relaxed max-w-3xl mx-auto"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.65))",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                    >
                        To help teams focus on{" "}
                        <span
                            style={{
                                background: "linear-gradient(135deg, #5EEAD4, #06B6D4)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            relationships and follow-up
                        </span>{" "}
                        — not email logistics.
                    </motion.p>

                    <motion.p
                        className="relative text-sm mt-6"
                        style={{ color: "var(--color-muted-foreground)" }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        Giving outbound teams a single workspace for every stage of email operations.
                    </motion.p>
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   5.  Product Roadmap
   ───────────────────────────────────────────── */
function ProductRoadmap() {
    const milestones = [
        {
            label: "Today",
            title: "Email Ops Workspace",
            description:
                "Datasets, AI-assisted compose, Gmail sync, reply tracking, and sent records — everything for outbound email operations.",
            icon: Mail,
            accent: "#22C55E",
            accentBg: "rgba(34, 197, 94, 0.12)",
            accentBorder: "rgba(34, 197, 94, 0.25)",
            features: ["CSV import & datasets", "AI email refinement", "Approval-first replies"],
        },
        {
            label: "Next",
            title: "Advanced Analytics",
            description:
                "Response rate insights, send pattern optimization, and A/B testing for email templates.",
            icon: TrendingUp,
            accent: "#5EEAD4",
            accentBg: "rgba(94, 234, 212, 0.08)",
            accentBorder: "rgba(94, 234, 212, 0.2)",
            features: ["Open rate tracking", "Response analytics", "Template A/B testing"],
        },
        {
            label: "Future",
            title: "Multi-Channel Outreach",
            description:
                "Extend beyond email — LinkedIn, WhatsApp, and SMS integration for unified outreach management.",
            icon: Globe,
            accent: "#67E8F9",
            accentBg: "rgba(103, 232, 249, 0.08)",
            accentBorder: "rgba(103, 232, 249, 0.2)",
            features: ["LinkedIn automation", "WhatsApp integration", "Unified inbox"],
        },
    ];

    return (
        <motion.div
            className=""
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
        >
            <div className="text-center mb-14">
                <motion.h3
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{
                        color: "var(--color-foreground)",
                        fontFamily: "var(--font-display)",
                        letterSpacing: "-0.02em",
                    }}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                >
                    Product Roadmap
                </motion.h3>
                <motion.p
                    className="text-base md:text-lg max-w-2xl mx-auto"
                    style={{ color: "var(--color-muted-foreground)" }}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                >
                    Building the ultimate email operations platform — one milestone at a time.
                </motion.p>
            </div>

            <div className="relative">
                <motion.div
                    className="absolute top-[72px] left-0 right-0 h-px hidden lg:block"
                    style={{
                        background:
                            "linear-gradient(90deg, transparent 5%, rgba(94, 234, 212, 0.3) 20%, rgba(94, 234, 212, 0.4) 50%, rgba(94, 234, 212, 0.3) 80%, transparent 95%)",
                    }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
                />

                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(ellipse at center, rgba(94, 234, 212, 0.04), transparent 70%)",
                        filter: "blur(80px)",
                    }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {milestones.map((milestone, i) => (
                        <motion.div
                            key={milestone.title}
                            className="relative"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.7,
                                delay: 0.2 + i * 0.15,
                                ease: "easeOut",
                            }}
                        >
                            <motion.div
                                className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${milestone.accentBg}, rgba(6, 182, 212, 0.06))`,
                                    border: `2px solid ${milestone.accentBorder}`,
                                    boxShadow: `0 0 20px ${milestone.accentBg}, 0 8px 25px rgba(0,0,0,0.3)`,
                                }}
                                whileHover={{
                                    scale: 1.15,
                                    boxShadow: `0 0 35px ${milestone.accentBorder}`,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                {i === 0 && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full pointer-events-none"
                                        style={{ border: `2px solid ${milestone.accent}` }}
                                        animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                                    />
                                )}
                                <milestone.icon className="h-5 w-5" style={{ color: milestone.accent }} />
                            </motion.div>

                            <GlassCard className="relative p-6 md:p-8 h-full" hover={true}>
                                <div
                                    className="absolute top-4 right-5 select-none pointer-events-none"
                                    style={{
                                        fontSize: "6rem",
                                        fontFamily: "var(--font-display)",
                                        fontWeight: 900,
                                        lineHeight: 1,
                                        color: "transparent",
                                        WebkitTextStroke: `1px rgba(94, 234, 212, 0.06)`,
                                    }}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </div>

                                <div className="relative">
                                    <motion.span
                                        className="inline-block text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full mb-4"
                                        style={{
                                            background: milestone.accentBg,
                                            color: milestone.accent,
                                            border: `1px solid ${milestone.accentBorder}`,
                                        }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.4 + i * 0.15 }}
                                    >
                                        {i === 0 ? "● " : ""}{milestone.label}
                                    </motion.span>

                                    <h4
                                        className="text-xl md:text-2xl font-bold mb-3"
                                        style={{
                                            color: "var(--color-foreground)",
                                            fontFamily: "var(--font-display)",
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        {milestone.title}
                                    </h4>

                                    <p
                                        className="text-sm leading-relaxed mb-5"
                                        style={{ color: "var(--color-muted-foreground)" }}
                                    >
                                        {milestone.description}
                                    </p>

                                    <div className="space-y-2">
                                        {milestone.features.map((feature, fi) => (
                                            <motion.div
                                                key={feature}
                                                className="flex items-center gap-2"
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.4, delay: 0.5 + i * 0.15 + fi * 0.08 }}
                                            >
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ background: milestone.accent }}
                                                />
                                                <span
                                                    className="text-xs"
                                                    style={{ color: "rgba(255,255,255,0.6)" }}
                                                >
                                                    {feature}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Main About / Use Cases Section
   ───────────────────────────────────────────── */
export function AboutUs() {
    return (
        <section className="w-full max-w-7xl mx-auto px-6 py-24">
            <HeroStatement />
            <WhyEAOS />
            <UseCasesSection />
            <OurMission />
            <ProductRoadmap />
        </section>
    );
}
