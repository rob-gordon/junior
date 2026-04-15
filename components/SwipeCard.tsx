"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import type { NameRow } from "@/lib/api";
import NameCard from "./NameCard";

type Props = {
  name: NameRow;
  onVote: (vote: "yes" | "no") => Promise<void>;
  onError?: (err: Error) => void;
};

export default function SwipeCard({ name, onVote, onError }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-14, 0, 14]);
  const yesOpacity = useTransform(x, [20, 140], [0, 1]);
  const noOpacity = useTransform(x, [-140, -20], [1, 0]);

  async function commit(vote: "yes" | "no") {
    const direction = vote === "yes" ? 1 : -1;
    const exit = animate(x, direction * 600, { duration: 0.25 });
    try {
      await onVote(vote);
      await exit.then(() => undefined);
    } catch (e) {
      await exit.then(() => undefined);
      animate(x, 0, { type: "spring", stiffness: 300, damping: 28 });
      onError?.(e as Error);
    }
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold =
      (typeof window !== "undefined" ? window.innerWidth : 400) * 0.4;
    const current = x.get();
    if (current > threshold || info.velocity.x > 600) {
      commit("yes");
    } else if (current < -threshold || info.velocity.x < -600) {
      commit("no");
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 28 });
    }
  }

  return (
    <motion.div
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 rounded-3xl border border-surface-border bg-surface shadow-xl touch-none select-none p-8 flex items-center justify-center"
    >
      <motion.div
        style={{ opacity: noOpacity }}
        className="absolute top-6 left-6 text-accent text-3xl font-black border-4 border-accent rounded-xl px-3 py-1 rotate-[-12deg] pointer-events-none"
      >
        NO
      </motion.div>
      <motion.div
        style={{ opacity: yesOpacity }}
        className="absolute top-6 right-6 text-sage text-3xl font-black border-4 border-sage rounded-xl px-3 py-1 rotate-[12deg] pointer-events-none"
      >
        YES
      </motion.div>
      <div className="w-full text-center">
        <NameCard name={name} size="lg" expanded />
      </div>
    </motion.div>
  );
}
