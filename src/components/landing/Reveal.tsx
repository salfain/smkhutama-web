"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const inView = { once: true, amount: 0.2 } as const;

export function RevealContainer({
  children, className = "", stagger = 0.15, delayChildren = 0.1,
}: { children: ReactNode; className?: string; stagger?: number; delayChildren?: number }) {
  const reduce = useReducedMotion();
  const variants: Variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: stagger, delayChildren } } };
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={inView} variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children, className = "", y = 18, dur = 0.28, delay = 0,
}: { children: ReactNode; className?: string; y?: number; dur?: number; delay?: number }) {
  const reduce = useReducedMotion();
  const variants: Variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0, transition: { duration: dur, ease: "easeOut", delay } } };
  return <motion.div variants={variants} className={className}>{children}</motion.div>;
}

export function RevealCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } }
      }}
      whileHover={{
        y: -6,
        scale: 1.018,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealImage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const variants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.25, 0, 1] } },
  };
  return <motion.div variants={variants} className={className}>{children}</motion.div>;
}
