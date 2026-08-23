"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type FoMood = "happy" | "wave" | "celebrate" | "sleepy" | "thinking";

type Props = {
  mood?: FoMood;
  size?: number;
  className?: string;
  animate?: boolean;
};

const mouths: Record<FoMood, string> = {
  happy: "M24 40 Q32 47 40 40",
  wave: "M25 40 Q32 46 39 40",
  celebrate: "M23 38 Q32 52 41 38 Z",
  sleepy: "M27 42 Q32 45 37 42",
  thinking: "M26 42 Q32 40 38 43",
};

/**
 * Fô — o avatar do Foco. Um brotinho verde simpático que lembra, comemora e acompanha.
 */
export function FoAvatar({ mood = "happy", size = 64, className, animate = true }: Props) {
  const isCelebrate = mood === "celebrate";
  const isSleepy = mood === "sleepy";

  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={`Fô, avatar do Foco (${mood})`}
      className={cn("select-none", className)}
      animate={
        animate
          ? isCelebrate
            ? { y: [0, -6, 0], rotate: [0, -4, 4, 0] }
            : mood === "wave"
              ? { rotate: [0, -3, 3, 0] }
              : { y: [0, -2, 0] }
          : undefined
      }
      transition={{ duration: isCelebrate ? 0.8 : 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="fo-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--chart-2)" />
          <stop offset="100%" stopColor="var(--chart-4)" />
        </linearGradient>
        <linearGradient id="fo-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" />
          <stop offset="100%" stopColor="var(--chart-3)" />
        </linearGradient>
      </defs>

      {/* brotinho */}
      <motion.g
        style={{ originX: "32px", originY: "14px" }}
        animate={animate ? { rotate: [-6, 6, -6] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M32 14 C32 9 33 6 36 4" stroke="var(--chart-4)" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M36 4 C40 2 44 4 44 8 C40 9 37 8 36 4 Z" fill="url(#fo-leaf)" />
        <path d="M36 4 C32 1 28 3 28 7 C31 8 34 7 36 4 Z" fill="url(#fo-leaf)" opacity="0.85" />
      </motion.g>

      {/* corpo */}
      <rect x="8" y="14" width="48" height="44" rx="20" fill="url(#fo-body)" />
      <ellipse cx="22" cy="26" rx="9" ry="6" fill="white" opacity="0.14" />

      {/* bochechas */}
      <circle cx="18" cy="40" r="3.2" fill="oklch(0.75 0.16 25)" opacity="0.45" />
      <circle cx="46" cy="40" r="3.2" fill="oklch(0.75 0.16 25)" opacity="0.45" />

      {/* olhos */}
      {isSleepy ? (
        <>
          <path d="M19 34 Q24 37 29 34" stroke="oklch(0.2 0 0)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M35 34 Q40 37 45 34" stroke="oklch(0.2 0 0)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <text x="50" y="22" fontSize="9" fontWeight="700" fill="oklch(0.2 0 0)" opacity="0.6">z</text>
        </>
      ) : (
        <g className="fo-eyes">
          <motion.g
            style={{ originY: "34px" }}
            animate={animate ? { scaleY: [1, 1, 0.1, 1, 1] } : undefined}
            transition={{ duration: 4, times: [0, 0.9, 0.93, 0.96, 1], repeat: Infinity, repeatDelay: 1.5 }}
          >
            <ellipse cx="24" cy="33" rx="4.6" ry={isCelebrate ? 5.4 : 5} fill="white" />
            <ellipse cx="40" cy="33" rx="4.6" ry={isCelebrate ? 5.4 : 5} fill="white" />
            <circle cx={mood === "thinking" ? 26 : 25} cy={mood === "thinking" ? 32 : 34} r="2.4" fill="oklch(0.2 0 0)" />
            <circle cx={mood === "thinking" ? 42 : 41} cy={mood === "thinking" ? 32 : 34} r="2.4" fill="oklch(0.2 0 0)" />
            <circle cx="26" cy="32.6" r="0.9" fill="white" />
            <circle cx="42" cy="32.6" r="0.9" fill="white" />
          </motion.g>
        </g>
      )}

      {/* sobrancelhas */}
      {mood === "thinking" && (
        <>
          <path d="M19 26 L28 28" stroke="oklch(0.2 0 0)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <path d="M36 27 L45 25" stroke="oklch(0.2 0 0)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </>
      )}

      {/* boca */}
      <path
        d={mouths[mood]}
        stroke="oklch(0.2 0 0)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill={isCelebrate ? "oklch(0.35 0.08 25)" : "none"}
      />

      {/* mãozinha acenando */}
      {mood === "wave" && (
        <motion.g
          style={{ originX: "54px", originY: "44px" }}
          animate={animate ? { rotate: [0, 25, -10, 25, 0] } : undefined}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
        >
          <circle cx="57" cy="40" r="5" fill="var(--chart-3)" />
        </motion.g>
      )}
    </motion.svg>
  );
}
