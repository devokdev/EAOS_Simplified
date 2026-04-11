import type { Transition } from "motion/react";

export const MOTION_EASING = {
  softOut: [0.22, 1, 0.36, 1],
  smooth: [0.4, 0, 0.2, 1],
  emphasized: [0.2, 0.8, 0.2, 1],
  micro: [0.25, 0.46, 0.45, 0.94],
} as const;

export const MOTION_DURATION = {
  micro: 0.16,
  short: 0.24,
  medium: 0.42,
  long: 0.72,
  ambient: 8,
  slowAmbient: 12,
} as const;

export const MOTION_STAGGER = {
  tight: 0.06,
  base: 0.09,
  relaxed: 0.12,
} as const;

export const VIEWPORT_REVEAL = {
  once: true,
  amount: 0.28,
  margin: "0px 0px -10% 0px",
} as const;

interface RevealUpOptions {
  delay?: number;
  distance?: number;
  scale?: number;
  duration?: number;
}

export function revealUp(options: RevealUpOptions = {}) {
  const {
    delay = 0,
    distance = 12,
    scale = 0.985,
    duration = MOTION_DURATION.medium,
  } = options;

  return {
    initial: { opacity: 0, y: distance, scale },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: VIEWPORT_REVEAL,
    transition: {
      duration,
      delay,
      ease: MOTION_EASING.softOut,
    } as Transition,
  };
}

export function enterTransition(delay: number = 0, duration: number = MOTION_DURATION.medium): Transition {
  return {
    delay,
    duration,
    ease: MOTION_EASING.softOut,
  };
}

export function smoothTransition(delay: number = 0, duration: number = MOTION_DURATION.short): Transition {
  return {
    delay,
    duration,
    ease: MOTION_EASING.smooth,
  };
}

export function microTransition(delay: number = 0, duration: number = MOTION_DURATION.micro): Transition {
  return {
    delay,
    duration,
    ease: MOTION_EASING.micro,
  };
}

export function ambientLoop(duration: number = MOTION_DURATION.ambient, delay: number = 0): Transition {
  return {
    duration,
    delay,
    ease: MOTION_EASING.smooth,
    repeat: Infinity,
  };
}

export function premiumHover(reducedMotion: boolean) {
  if (reducedMotion) return {};
  return { y: -2, scale: 1.015 };
}

