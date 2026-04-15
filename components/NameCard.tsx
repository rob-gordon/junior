"use client";

import type { NameRow } from "@/lib/api";

type Props = {
  name: NameRow;
  size?: "sm" | "md" | "lg";
  expanded?: boolean;
  onToggle?: () => void;
};

const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-2xl font-display",
  md: "text-4xl font-display",
  lg: "text-6xl sm:text-7xl font-display",
};

export default function NameCard({
  name,
  size = "md",
  expanded = false,
  onToggle,
}: Props) {
  const showDetails = expanded || size === "lg";
  const hasMeta = name.meaning || name.origin;

  return (
    <div
      onClick={onToggle}
      className={onToggle ? "cursor-pointer" : undefined}
    >
      <div
        className={`font-bold tracking-tight text-balance leading-[1.05] ${sizeClasses[size]}`}
      >
        {name.name}
      </div>
      {showDetails && hasMeta && (
        <div className="text-sm text-muted-foreground mt-3">
          {[name.origin, name.meaning].filter(Boolean).join(" · ")}
        </div>
      )}
      {showDetails && name.description && (
        <p className="text-sm mt-2 text-muted-foreground">
          {name.description}
        </p>
      )}
    </div>
  );
}
