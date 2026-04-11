import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { MOTION_DURATION, enterTransition, smoothTransition } from "../lib/motion";

const navItems = [
    { label: "Features", sectionId: "features" },
    { label: "How it Works", sectionId: "how-it-works" },
    { label: "Use Cases", sectionId: "use-cases" },
    { label: "Get Started", sectionId: "get-started" },
];

interface HeaderProps {
    onNavigate?: (sectionId: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
    const prefersReducedMotion = useReducedMotion();
    const disableAdvancedAnimations = Boolean(prefersReducedMotion);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLinkClick = (e: React.MouseEvent<HTMLElement>, item: typeof navItems[0]) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate(item.sectionId);
        }
    };

    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={enterTransition(0.04, MOTION_DURATION.long)}
        >
            <div
                className="mx-auto transition-all duration-500"
                style={{
                    maxWidth: scrolled ? "900px" : "100%",
                    margin: scrolled ? "12px auto 0" : "0 auto",
                    borderRadius: scrolled ? "16px" : "0",
                    background: scrolled
                        ? "rgba(20, 20, 22, 0.75)"
                        : "rgba(20, 20, 22, 0.4)",
                    backdropFilter: "blur(24px) saturate(1.4)",
                    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                    borderStyle: "solid",
                    borderTopWidth: scrolled ? "1px" : "0",
                    borderRightWidth: scrolled ? "1px" : "0",
                    borderLeftWidth: scrolled ? "1px" : "0",
                    borderBottomWidth: "1px",
                    borderBottomStyle: "solid",
                    borderTopColor: scrolled ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    borderRightColor: scrolled ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    borderLeftColor: scrolled ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    borderBottomColor: scrolled
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(255, 255, 255, 0.06)",
                    boxShadow: scrolled
                        ? "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                        : "none",
                }}
            >
                <div className="flex items-center justify-between px-6 py-3">
                    {/* Logo */}
                    <motion.a
                        href="#"
                        className="flex items-center gap-2.5 group"
                        whileHover={disableAdvancedAnimations ? undefined : { scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={smoothTransition()}
                        onClick={(e) => {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    >
                        {/* EAOS Logo Icon — Envelope + AI circuit motif */}
                        <div className="relative w-9 h-9 flex items-center justify-center">
                            <svg
                                width="36"
                                height="36"
                                viewBox="0 0 100 100"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Envelope body */}
                                <rect
                                    x="12" y="28" width="76" height="50" rx="8"
                                    fill="url(#envelopeGrad)"
                                    opacity="0.9"
                                />
                                {/* Envelope flap */}
                                <path
                                    d="M12 36 L50 58 L88 36"
                                    stroke="url(#flapGrad)"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    fill="none"
                                    opacity="0.95"
                                />
                                {/* AI sparkle dots */}
                                <circle cx="30" cy="50" r="3" fill="#67E8F9" opacity="0.7" />
                                <circle cx="50" cy="44" r="2.5" fill="#5EEAD4" opacity="0.5" />
                                <circle cx="70" cy="50" r="3" fill="#67E8F9" opacity="0.7" />
                                {/* Connection lines (AI circuit) */}
                                <line x1="33" y1="50" x2="47" y2="44" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.3" />
                                <line x1="53" y1="44" x2="67" y2="50" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.3" />
                                <defs>
                                    <linearGradient
                                        id="envelopeGrad"
                                        x1="12" y1="28" x2="88" y2="78"
                                        gradientUnits="userSpaceOnUse"
                                    >
                                        <stop offset="0%" stopColor="#0E7490" />
                                        <stop offset="100%" stopColor="#155E75" />
                                    </linearGradient>
                                    <linearGradient
                                        id="flapGrad"
                                        x1="12" y1="36" x2="88" y2="36"
                                        gradientUnits="userSpaceOnUse"
                                    >
                                        <stop offset="0%" stopColor="#5EEAD4" />
                                        <stop offset="50%" stopColor="#06B6D4" />
                                        <stop offset="100%" stopColor="#67E8F9" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span
                            className="text-xl font-bold tracking-tight transition-colors duration-300"
                            style={{
                                color: "rgba(255, 255, 255, 0.95)",
                                fontFamily: "var(--font-display)",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            EAOS
                        </span>
                    </motion.a>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item, index) => (
                            <motion.a
                                key={item.label}
                                href={`#${item.sectionId}`}
                                className="motion-premium-link relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-[var(--motion-duration-short)] group"
                                style={{
                                    color: "rgba(255, 255, 255, 0.65)",
                                }}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    ...enterTransition(0.07 * (index + 1), MOTION_DURATION.medium),
                                }}
                                whileHover={{
                                    color: "rgba(255, 255, 255, 1)",
                                    y: disableAdvancedAnimations ? 0 : -2,
                                    backgroundColor: "rgba(255, 255, 255, 0.055)",
                                }}
                                onClick={(e) => handleLinkClick(e, item)}
                                whileTap={{ scale: 0.98 }}
                            >
                                {item.label}
                                {/* Hover underline glow */}
                                <motion.span
                                    className="absolute bottom-0.5 left-4 right-4 h-px rounded-full"
                                    style={{
                                        background:
                                            "linear-gradient(90deg, transparent, rgba(94, 234, 212, 0.6), transparent)",
                                    }}
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    whileHover={{ scaleX: 1, opacity: 1 }}
                                    transition={smoothTransition()}
                                />
                            </motion.a>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <motion.button
                        className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        whileTap={{ scale: 0.98 }}
                        transition={smoothTransition()}
                        style={{
                            background: "rgba(255, 255, 255, 0.06)",
                        }}
                    >
                        <motion.span
                            className="block w-5 h-0.5 rounded-full"
                            style={{ background: "rgba(255, 255, 255, 0.8)" }}
                            animate={
                                mobileMenuOpen
                                    ? { rotate: 45, y: 4 }
                                    : { rotate: 0, y: 0 }
                            }
                            transition={smoothTransition()}
                        />
                        <motion.span
                            className="block w-5 h-0.5 rounded-full"
                            style={{ background: "rgba(255, 255, 255, 0.8)" }}
                            animate={
                                mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }
                            }
                            transition={smoothTransition(0, MOTION_DURATION.micro)}
                        />
                        <motion.span
                            className="block w-5 h-0.5 rounded-full"
                            style={{ background: "rgba(255, 255, 255, 0.8)" }}
                            animate={
                                mobileMenuOpen
                                    ? { rotate: -45, y: -4 }
                                    : { rotate: 0, y: 0 }
                            }
                            transition={smoothTransition()}
                        />
                    </motion.button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.nav
                            className="md:hidden overflow-hidden"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={smoothTransition()}
                        >
                            <div
                                className="px-4 pb-4 pt-1 flex flex-col gap-1"
                                style={{
                                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                                }}
                            >
                                {navItems.map((item, index) => (
                                    <motion.a
                                        key={item.label}
                                        href={`#${item.sectionId}`}
                                        className="motion-premium-link px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-[var(--motion-duration-short)]"
                                        style={{
                                            color: "rgba(255, 255, 255, 0.7)",
                                        }}
                                        initial={{ x: -14, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{
                                            ...enterTransition(0.05 * index, MOTION_DURATION.short),
                                        }}
                                        whileHover={{
                                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                                            color: "rgba(255, 255, 255, 1)",
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                            setMobileMenuOpen(false);
                                            handleLinkClick(e, item);
                                        }}
                                    >
                                        {item.label}
                                    </motion.a>
                                ))}
                            </div>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
}
