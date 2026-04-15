"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import type { NameRow } from "@/lib/api";
import NameCard from "./NameCard";

type Props = {
  name: NameRow;
  onDismiss: () => void;
};

const CONFETTI_COUNT = 36;
const CONFETTI_COLORS = ["#d97757", "#8a9a8b", "#e9c46a", "#f4a261", "#ffffff"];

type Particle = {
  x: number;
  y: number;
  rotate: number;
  color: string;
  delay: number;
  size: number;
};

export default function MatchCelebration({ name, onDismiss }: Props) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: CONFETTI_COUNT }, () => ({
        x: (Math.random() - 0.5) * 600,
        y: -Math.random() * 500 - 100,
        rotate: (Math.random() - 0.5) * 720,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.15,
        size: 8 + Math.random() * 6,
      })),
    [],
  );

  useEffect(() => {
    const t = setTimeout(onDismiss, 2000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-background/80 px-6 text-center"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: 0 }}
            transition={{ duration: 1.6, delay: p.delay, ease: "easeOut" }}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              left: "50%",
              top: "55%",
            }}
            className="absolute rounded-sm"
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.6, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative z-10"
      >
        <div className="text-xl font-semibold text-accent mb-4">
          It&apos;s a match! 🎉
        </div>
        <NameCard name={name} size="lg" expanded />
      </motion.div>
    </motion.div>
  );
}
