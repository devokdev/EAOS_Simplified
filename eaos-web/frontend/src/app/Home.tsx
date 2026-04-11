import { memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { LiveDemo } from "./components/AppMockup";
import { FeatureCards } from "./components/FeatureCards";
import { HowItWorks } from "./components/HowItWorks";
import { AboutUs } from "./components/AboutUs";
import { ArrowRight, Github } from "lucide-react";
import {
    MOTION_DURATION,
    MOTION_EASING,
    enterTransition,
    smoothTransition,
} from "./lib/motion";

const MemoLiveDemo = memo(LiveDemo);
const MemoFeatureCards = memo(FeatureCards);
const MemoHowItWorks = memo(HowItWorks);
const MemoAboutUs = memo(AboutUs);

interface HomeProps {
    highlightedSection: string | null;
}

export function Home({ highlightedSection }: HomeProps) {
    const prefersReducedMotion = useReducedMotion();
    const disableAdvancedAnimations = Boolean(prefersReducedMotion);

    return (
        <>
            {/* Main hero content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 16, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={enterTransition(0.08, MOTION_DURATION.long)}
                >
                    {/* Main heading */}
                    <motion.h1
                        className="relative mb-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={enterTransition(0.14, MOTION_DURATION.medium)}
                        style={{
                            fontSize: "clamp(2.6rem, 7vw, 5.8rem)",
                            fontFamily: "var(--font-display)",
                            fontWeight: 800,
                            lineHeight: 1.05,
                            letterSpacing: "-0.04em",
                        }}
                    >
                        {["AI-Powered", "Email", "Operations."].map((word, i) => (
                            <motion.span
                                key={word}
                                className="inline-block mr-[0.25em]"
                                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={enterTransition(0.2 + i * 0.1, MOTION_DURATION.medium)}
                                style={{
                                    ...(word === "Email"
                                        ? {
                                            background: "linear-gradient(135deg, #5EEAD4, #06B6D4, #67E8F9)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            backgroundClip: "text",
                                            textShadow: "none",
                                        }
                                        : {
                                            color: "rgba(255, 255, 255, 0.95)",
                                            textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                                        }),
                                }}
                            >
                                {word}
                            </motion.span>
                        ))}

                        <motion.span
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: "linear-gradient(105deg, transparent 40%, rgba(94, 234, 212, 0.12) 50%, transparent 60%)",
                                backgroundSize: "200% 100%",
                            }}
                            animate={
                                disableAdvancedAnimations
                                    ? { opacity: 0.45 }
                                    : { backgroundPosition: ["-100% 0%", "200% 0%"] }
                            }
                            transition={
                                disableAdvancedAnimations
                                    ? undefined
                                    : {
                                        duration: MOTION_DURATION.slowAmbient,
                                        repeat: Infinity,
                                        repeatDelay: 3,
                                        ease: MOTION_EASING.smooth,
                                    }
                            }
                        />
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-xl max-w-3xl mx-auto mb-14"
                        initial={{ opacity: 0, y: 14, scale: 0.992 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={enterTransition(0.32, MOTION_DURATION.long)}
                        style={{
                            color: "var(--color-foreground)",
                            fontFamily: "var(--font-body)",
                            lineHeight: 1.8,
                            fontWeight: 400,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        EAOS is an AI-assisted workspace for teams that send outbound emails,
                        track replies, and want approval-first automation instead of blind autoresponders.
                    </motion.p>

                    <motion.div
                        id="get-started"
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 scroll-mt-24"
                        initial={{ opacity: 0, y: 10, scale: 0.992 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={enterTransition(0.42, MOTION_DURATION.medium)}
                    >
                        {/* Primary CTA */}
                        <motion.a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold cursor-pointer"
                            style={{
                                background: "linear-gradient(135deg, rgba(94, 234, 212, 0.2), rgba(6, 182, 212, 0.15))",
                                border: "1px solid rgba(94, 234, 212, 0.4)",
                                color: "#5EEAD4",
                                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), 0 0 24px rgba(94, 234, 212, 0.08)",
                            }}
                            whileHover={{
                                scale: 1.02,
                                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25), 0 0 40px rgba(94, 234, 212, 0.15)",
                                y: -2,
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={smoothTransition()}
                        >
                            <span>Get Started</span>
                            <ArrowRight className="h-4 w-4" />
                        </motion.a>

                        {/* Secondary CTA */}
                        <motion.a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold cursor-pointer"
                            style={{
                                background: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                color: "rgba(255, 255, 255, 0.7)",
                            }}
                            whileHover={{
                                scale: 1.02,
                                backgroundColor: "rgba(255, 255, 255, 0.08)",
                                borderColor: "rgba(255, 255, 255, 0.2)",
                                color: "rgba(255, 255, 255, 0.95)",
                                y: -2,
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={smoothTransition()}
                        >
                            <Github className="h-4 w-4" />
                            <span>View on GitHub</span>
                        </motion.a>
                    </motion.div>

                    <motion.div
                        className="text-xs tracking-wide font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={enterTransition(0.52, MOTION_DURATION.medium)}
                        style={{
                            color: "var(--color-muted-foreground)",
                        }}
                    >
                        FastAPI • React • Gmail • Gemini AI • PostgreSQL
                    </motion.div>
                </motion.div>

                <motion.div
                    className="w-full max-w-6xl"
                    initial={{ opacity: 0, y: 16, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={enterTransition(0.6, MOTION_DURATION.long)}
                >
                    <MemoLiveDemo />
                </motion.div>
            </div>

            <div id="features" className="relative z-10 scroll-mt-20">
                <MemoFeatureCards />
            </div>

            <div id="how-it-works" className="relative z-10 scroll-mt-20">
                <MemoHowItWorks />
            </div>

            <div id="use-cases" className="relative z-10 scroll-mt-20">
                <MemoAboutUs />
            </div>
        </>
    );
}
