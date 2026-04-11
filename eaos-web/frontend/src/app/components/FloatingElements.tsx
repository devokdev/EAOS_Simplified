import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { MOTION_EASING } from "../lib/motion";

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  depth: number; // 1 = back, 2 = middle, 3 = front
}

interface FloatingElementsProps {
  mouseX: number;
  mouseY: number;
}

export function FloatingElements({ mouseX, mouseY }: FloatingElementsProps) {
  const prefersReducedMotion = useReducedMotion();
  const disableAdvancedAnimations = Boolean(prefersReducedMotion);
  const [elements] = useState<FloatingElement[]>([
    { id: 1, x: 12, y: 15, size: 180, duration: 28, delay: 0, depth: 1 },
    { id: 2, x: 80, y: 20, size: 140, duration: 24, delay: 2, depth: 2 },
    { id: 3, x: 88, y: 65, size: 160, duration: 26, delay: 1, depth: 1 },
    { id: 4, x: 8, y: 75, size: 100, duration: 20, delay: 3, depth: 3 },
    { id: 5, x: 50, y: 8, size: 200, duration: 30, delay: 1.5, depth: 1 },
  ]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element) => {
        // Calculate parallax based on depth
        const parallaxMultiplier = disableAdvancedAnimations
          ? 0
          : element.depth === 1
            ? -12
            : element.depth === 2
              ? -7
              : -2.5;
        const parallaxX = (mouseX - 0.5) * parallaxMultiplier;
        const parallaxY = (mouseY - 0.5) * parallaxMultiplier;
        
        // Opacity based on depth
        const opacity = element.depth === 1 ? 0.32 : element.depth === 2 ? 0.45 : 0.58;

        return (
          <motion.div
            key={element.id}
            className="absolute"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: element.size,
              height: element.size,
              opacity: opacity,
              x: parallaxX,
              y: parallaxY,
              zIndex: element.depth,
            }}
            animate={
              disableAdvancedAnimations
                ? undefined
                : {
                  y: [parallaxY - 10, parallaxY + 10, parallaxY - 10],
                  x: [parallaxX - 6, parallaxX + 6, parallaxX - 6],
                }
            }
            transition={
              disableAdvancedAnimations
                ? undefined
                : {
                  duration: element.duration,
                  repeat: Infinity,
                  delay: element.delay,
                  ease: MOTION_EASING.smooth,
                }
            }
          >
            {/* Main sphere with depth shadow */}
            <div className="relative w-full h-full">
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.35), rgba(161, 134, 111, 0.08))",
                  border: '1px solid rgba(161, 134, 111, 0.15)',
                  boxShadow: `
                    0 ${element.depth * 8}px ${element.depth * 24}px rgba(139, 111, 71, ${0.04 * element.depth}),
                    inset 0 1px 1px rgba(255, 255, 255, 0.3)
                  `,
                }}
              />
              
              {/* Ambient light reflection */}
              <motion.div
                className="absolute top-[15%] left-[20%] w-[40%] h-[40%] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(255, 255, 255, 0.28), transparent 60%)",
                }}
                animate={disableAdvancedAnimations ? undefined : { opacity: [0.3, 0.5, 0.3] }}
                transition={
                  disableAdvancedAnimations
                    ? undefined
                    : {
                      duration: 4,
                      repeat: Infinity,
                      ease: MOTION_EASING.smooth,
                    }
                }
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
