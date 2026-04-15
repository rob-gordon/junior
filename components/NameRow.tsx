"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { useRef } from "react";
import type { NameRow as NameRowType } from "@/lib/api";
import NameCard from "./NameCard";

type Props = {
  name: NameRowType;
  /**
   * Direction the row should fly on commit — "right" means "swipe right
   * moves to yes" (for No tab rows), "left" means "swipe left moves to no"
   * (for Yes tab rows).
   */
  swipeDirection: "left" | "right";
  expanded: boolean;
  onToggle: () => void;
  onCommit: () => Promise<void>;
  onError: (err: Error) => void;
};

export default function NameRow({
  name,
  swipeDirection,
  expanded,
  onToggle,
  onCommit,
  onError,
}: Props) {
  const x = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);

  const leftOpacity = useTransform(x, [-120, -20], [1, 0]);
  const rightOpacity = useTransform(x, [20, 120], [0, 1]);

  async function commit() {
    const width = ref.current?.offsetWidth ?? 300;
    const target = swipeDirection === "right" ? width + 80 : -(width + 80);
    const exit = animate(x, target, { duration: 0.2 });
    try {
      await onCommit();
      await exit.then(() => undefined);
      // parent will remove from list
    } catch (e) {
      await exit.then(() => undefined);
      animate(x, 0, { type: "spring", stiffness: 300, damping: 28 });
      onError(e as Error);
    }
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const width = ref.current?.offsetWidth ?? 300;
    const threshold = width * 0.4;
    const current = x.get();
    const goingRight = current > threshold || info.velocity.x > 500;
    const goingLeft = current < -threshold || info.velocity.x < -500;

    if (swipeDirection === "right" && goingRight) {
      commit();
    } else if (swipeDirection === "left" && goingLeft) {
      commit();
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 28 });
    }
  }

  const hintLeft = swipeDirection === "left" ? "→ No" : null;
  const hintRight = swipeDirection === "right" ? "Yes ←" : null;

  return (
    <motion.div
      ref={ref}
      drag="x"
      dragConstraints={{
        left: swipeDirection === "left" ? -1000 : 0,
        right: swipeDirection === "right" ? 1000 : 0,
      }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={{ x, touchAction: "pan-y" }}
      className="relative rounded-2xl border border-surface-border bg-surface p-5 shadow-sm select-none"
    >
      {hintRight && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className="absolute inset-y-0 left-4 flex items-center text-sage font-bold text-sm pointer-events-none"
        >
          {hintRight}
        </motion.div>
      )}
      {hintLeft && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute inset-y-0 right-4 flex items-center text-accent font-bold text-sm pointer-events-none"
        >
          {hintLeft}
        </motion.div>
      )}
      <NameCard
        name={name}
        size="md"
        expanded={expanded}
        onToggle={onToggle}
      />
    </motion.div>
  );
}
