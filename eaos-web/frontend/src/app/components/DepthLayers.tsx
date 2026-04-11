import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

interface DepthLayersProps {
  mouseX: number;
  mouseY: number;
}

export function DepthLayers({ mouseX, mouseY }: DepthLayersProps) {
  const prefersReducedMotion = useReducedMotion();
  const disableAdvancedAnimations = Boolean(prefersReducedMotion);
  const { scrollY } = useScroll();
  
  // Different parallax speeds for depth
  const layer1Y = useTransform(scrollY, [0, 1000], [0, disableAdvancedAnimations ? 0 : -140]);
  const layer2Y = useTransform(scrollY, [0, 1000], [0, disableAdvancedAnimations ? 0 : -90]);
  const layer3Y = useTransform(scrollY, [0, 1000], [0, disableAdvancedAnimations ? 0 : -45]);

  // Mouse-based parallax for depth
  const parallax1X = disableAdvancedAnimations ? 0 : (mouseX - 0.5) * -24;
  const parallax1Y = disableAdvancedAnimations ? 0 : (mouseY - 0.5) * -24;
  const parallax2X = disableAdvancedAnimations ? 0 : (mouseX - 0.5) * -12;
  const parallax2Y = disableAdvancedAnimations ? 0 : (mouseY - 0.5) * -12;
  const parallax3X = disableAdvancedAnimations ? 0 : (mouseX - 0.5) * -4;
  const parallax3Y = disableAdvancedAnimations ? 0 : (mouseY - 0.5) * -4;

  return (
    <>
      {/* Back layer - deepest */}
      <motion.div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          y: layer1Y,
          x: parallax1X,
        }}
      >
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(161, 134, 111, 0.08), transparent 72%)",
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139, 111, 71, 0.07), transparent 74%)",
          }}
        />
      </motion.div>

      {/* Middle layer */}
      <motion.div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          y: layer2Y,
          x: parallax2X,
        }}
      >
        <div 
          className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(161, 134, 111, 0.08), transparent 66%)",
          }}
        />
      </motion.div>

      {/* Front layer - closest */}
      <motion.div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          y: layer3Y,
          x: parallax3X,
        }}
      >
        <div 
          className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139, 111, 71, 0.1), transparent 60%)",
          }}
        />
      </motion.div>
    </>
  );
}
