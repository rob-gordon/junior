"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/api";

export default function SettingsPage() {
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then((s) => setLastName(s.babyLastName))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFlash(null);
    setError(null);
    try {
      const saved = await updateSettings({ babyLastName: lastName.trim() });
      setLastName(saved.babyLastName);
      setFlash(saved.babyLastName ? "Saved" : "Cleared");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 flex flex-col gap-8">
      <section>
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label
            htmlFor="baby-last-name"
            className="text-sm font-medium -mb-1"
          >
            Baby&rsquo;s last name
          </label>
          <input
            id="baby-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={loading ? "Loading…" : "Last name (optional)"}
            disabled={loading}
            className="rounded-xl border border-surface-border bg-surface px-4 py-3 text-lg disabled:opacity-50"
          />
          <p className="text-sm text-muted-foreground">
            Shown after each first name on the compare screen, so you can see
            — and say — the full name. Leave blank to show first names only.
          </p>
          <button
            type="submit"
            disabled={busy || loading}
            className="rounded-full bg-accent text-accent-foreground py-3 font-semibold disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          {flash && <p className="text-sm text-sage">{flash}</p>}
          {error && <p className="text-sm text-accent">{error}</p>}
        </form>
      </section>
    </div>
  );
}
