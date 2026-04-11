import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer group"
      animate={{
        y: [0, 8, 0],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div 
        className="text-xs font-medium tracking-wider"
        style={{ color: "rgba(99, 82, 61, 0.4)" }}
      >
        SCROLL
      </div>
      <div 
        className="w-5 h-9 rounded-full border flex items-start justify-center p-1 transition-all duration-300"
        style={{
          borderColor: "rgba(161, 134, 111, 0.25)",
        }}
      >
        <motion.div
          className="w-1 h-2 rounded-full"
          style={{
            background: "rgba(139, 111, 71, 0.5)",
          }}
          animate={{
            y: [0, 14, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.div>
  );
}
