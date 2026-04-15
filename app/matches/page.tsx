"use client";

export default function MatchesPage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <h2 className="text-xl font-bold mb-4">Matches</h2>
      <div className="rounded-2xl border border-surface-border bg-surface p-8 text-center text-muted-foreground">
        <p className="text-lg mb-2">No matches yet. Keep swiping!</p>
        <p className="text-sm">Tournament mode ships in Phase 2.</p>
      </div>
    </div>
  );
}
