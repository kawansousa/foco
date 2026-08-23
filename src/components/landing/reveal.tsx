"use client";

import { motion, type HTMLMotionProps } from "motion/react";

type Props = HTMLMotionProps<"div"> & { delay?: number };

export function Reveal({ delay = 0, children, ...props }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98], delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
