import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";
import { DepthLayers } from "./components/DepthLayers";
import { FloatingElements } from "./components/FloatingElements";

import { Header } from "./components/Header";
import {
  MOTION_DURATION,
  ambientLoop,
  smoothTransition,
} from "./lib/motion";
import { Routes, Route } from "react-router";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./Home").then((m) => ({ default: m.Home })));

const MemoHeader = memo(Header);

// Overlay that dims everything EXCEPT the target section (cutout via clip-path)
function DimOverlay({ sectionId }: { sectionId: string }) {
  const [cutout, setCutout] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const el = document.getElementById(sectionId);
    if (el) {
      const r = el.getBoundingClientRect();
      const pad = 16; // padding around the section
      setCutout({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    }
  }, [sectionId]);

  if (!cutout) return null;

  // Build a polygon that covers the entire viewport but has a rectangular hole
  // where the target section is. The polygon traces the outer edge clockwise,
  // then the inner cutout counter-clockwise.
  const clipPath = `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${cutout.left}px ${cutout.top}px,
    ${cutout.left}px ${cutout.top + cutout.height}px,
    ${cutout.left + cutout.width}px ${cutout.top + cutout.height}px,
    ${cutout.left + cutout.width}px ${cutout.top}px,
    ${cutout.left}px ${cutout.top}px
  )`;

  return (
    <>
      {/* Dark overlay with cutout hole */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          clipPath,
          pointerEvents: "none",
          zIndex: 45,
        }}
      />
      {/* Glow border around the highlighted section */}
      <div
        style={{
          position: "fixed",
          left: cutout.left,
          top: cutout.top,
          width: cutout.width,
          height: cutout.height,
          borderRadius: "20px",
          border: "2px solid rgba(94, 234, 212, 0.4)",
          boxShadow: `
            0 0 30px rgba(94, 234, 212, 0.2),
            0 0 60px rgba(94, 234, 212, 0.1),
            inset 0 0 30px rgba(94, 234, 212, 0.05)
          `,
          pointerEvents: "none",
          zIndex: 46,
        }}
      />
    </>
  );
}


export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(max-width: 900px), (hover: none), (pointer: coarse)").matches;
  });
  const disableAdvancedAnimations = Boolean(prefersReducedMotion) || isMobileViewport;
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [cursorPosition, setCursorPosition] = useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  }));
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mouseTargetRef = useRef({ x: 0.5, y: 0.5 });
  const cursorTargetRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  const handleNavigate = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // After scroll starts, trigger the highlight effect
      setTimeout(() => {
        setHighlightedSection(sectionId);
        setTimeout(() => setHighlightedSection(null), 1200);
      }, 600);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 900px), (hover: none), (pointer: coarse)");
    const sync = () => setIsMobileViewport(media.matches);
    sync();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (disableAdvancedAnimations) {
      setMousePosition({ x: 0.5, y: 0.5 });
      setCursorPosition({
        x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
      });
      return;
    }

    let rafId = 0;
    const smoothMouse = { x: mouseTargetRef.current.x, y: mouseTargetRef.current.y };
    const smoothCursor = { x: cursorTargetRef.current.x, y: cursorTargetRef.current.y };
    const lerpFactor = 0.09;

    const handleMouseMove = (e: MouseEvent) => {
      mouseTargetRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      cursorTargetRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const tick = () => {
      smoothMouse.x += (mouseTargetRef.current.x - smoothMouse.x) * lerpFactor;
      smoothMouse.y += (mouseTargetRef.current.y - smoothMouse.y) * lerpFactor;
      smoothCursor.x += (cursorTargetRef.current.x - smoothCursor.x) * lerpFactor;
      smoothCursor.y += (cursorTargetRef.current.y - smoothCursor.y) * lerpFactor;

      setMousePosition({ x: smoothMouse.x, y: smoothMouse.y });
      setCursorPosition({ x: smoothCursor.x, y: smoothCursor.y });
      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.cancelAnimationFrame(rafId);
    };
  }, [disableAdvancedAnimations]);

  useEffect(() => {
    let frame = 0;
    let latestScrollY = 0;

    const updateProgress = () => {
      frame = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        setScrollProgress(0);
        return;
      }
      const next = Math.min(1, Math.max(0, latestScrollY / maxScroll));
      setScrollProgress((prev) => (Math.abs(prev - next) > 0.002 ? next : prev));
    };

    const onScroll = () => {
      latestScrollY = window.scrollY;
      if (!frame) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    // Enable dark theme globally by adding the `dark` class to the root element
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  return (
    <MotionConfig reducedMotion={disableAdvancedAnimations ? "always" : "user"}>
      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        {/* Header Navigation */}
        <MemoHeader onNavigate={handleNavigate} />

        {/* Scroll progress accent */}
        <div className="fixed left-0 top-0 z-[75] h-[2px] w-full bg-transparent pointer-events-none">
          <motion.div
            className="h-full"
            animate={{ width: `${scrollProgress * 100}%` }}
            transition={
              disableAdvancedAnimations
                ? { duration: 0 }
                : smoothTransition(0, MOTION_DURATION.short)
            }
            style={{
              background:
                "linear-gradient(90deg, rgba(20,184,166,0.9) 0%, rgba(6,182,212,0.95) 60%, rgba(56,189,248,0.95) 100%)",
              boxShadow: "0 0 14px rgba(45,212,191,0.35)",
            }}
          />
        </div>

        {/* Animated background drift */}
        <motion.div
          className="fixed inset-[-12%] z-0 pointer-events-none opacity-70"
          style={{
            background:
              "radial-gradient(circle at 18% 24%, rgba(20,184,166,0.13), transparent 44%), radial-gradient(circle at 82% 12%, rgba(56,189,248,0.11), transparent 48%), radial-gradient(circle at 52% 85%, rgba(45,212,191,0.08), transparent 46%)",
            willChange: "transform",
          }}
          animate={
            disableAdvancedAnimations
              ? {}
              : {
                x: ["-1.8%", "1.8%", "-1.8%"],
                y: ["-1%", "1%", "-1%"],
              }
          }
          transition={disableAdvancedAnimations ? undefined : ambientLoop(18)}
        />

        {/* Grain and vignette depth */}
        {!disableAdvancedAnimations ? (
          <div
            className="fixed inset-0 z-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.12) 0.6px, transparent 0.6px)",
              backgroundSize: "3px 3px",
              mixBlendMode: "soft-light",
            }}
          />
        ) : null}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 54%, rgba(2, 7, 12, 0.5) 100%)",
          }}
        />

        {/* WebGL-inspired depth layers with parallax */}
        {!disableAdvancedAnimations ? (
          <DepthLayers mouseX={mousePosition.x} mouseY={mousePosition.y} />
        ) : null}

        {/* Radial ambient lighting that follows cursor */}
        {!disableAdvancedAnimations ? (
          <motion.div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: `
              radial-gradient(circle 800px at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, 
                rgba(161, 134, 111, 0.1) 0%, 
                transparent 60%)
            `,
            }}
            transition={smoothTransition(0, MOTION_DURATION.medium)}
          />
        ) : null}

        {/* Subtle background grid texture */}
        {!disableAdvancedAnimations ? (
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: `
              linear-gradient(rgba(99, 82, 61, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 82, 61, 0.5) 1px, transparent 1px)
            `,
              backgroundSize: "64px 64px",
            }}
          />
        ) : null}

        {/* Soft warm glow following cursor - very subtle */}
        {!disableAdvancedAnimations ? (
          <motion.div
            className="fixed pointer-events-none z-40"
            style={{
              left: cursorPosition.x,
              top: cursorPosition.y,
              transform: "translate(-50%, -50%)",
              willChange: "transform",
            }}
            transition={smoothTransition(0, MOTION_DURATION.short)}
          >
            <motion.div
              style={{
                width: "520px",
                height: "520px",
                background:
                  "radial-gradient(circle, rgba(161, 134, 111, 0.06) 0%, rgba(139, 111, 71, 0.03) 44%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.78, 0.92, 0.78],
              }}
              transition={ambientLoop(10)}
            />
          </motion.div>
        ) : null}

        {/* Floating glassmorphism elements with depth */}
        {!disableAdvancedAnimations ? (
          <FloatingElements mouseX={mousePosition.x} mouseY={mousePosition.y} />
        ) : null}

        {/* Dynamic Route Pages */}
        <Suspense fallback={
          <div className="flex-1 min-h-screen grid place-items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home highlightedSection={highlightedSection} />} />
          </Routes>
        </Suspense>

        {/* Section highlight overlay — dims everything except the active section */}
        <AnimatePresence>
          {highlightedSection && (
            <motion.div
              key="dim-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={smoothTransition(0, MOTION_DURATION.medium)}
              style={{ pointerEvents: "none" }}
            >
              <DimOverlay sectionId={highlightedSection} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom ambient light with depth */}
        <div className="fixed bottom-0 left-0 right-0 h-96 pointer-events-none -z-10">
          <motion.div
            className="h-full"
            style={{
              background: "radial-gradient(ellipse at bottom, rgba(161, 134, 111, 0.1), transparent 70%)",
            }}
            animate={
              disableAdvancedAnimations
                ? { opacity: 0.55 }
                : { opacity: [0.5, 0.7, 0.5] }
            }
            transition={disableAdvancedAnimations ? undefined : ambientLoop(10)}
          />
        </div>
      </div>
    </MotionConfig>
  );
}
