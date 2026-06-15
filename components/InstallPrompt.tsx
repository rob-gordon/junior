"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MoreVertical } from "lucide-react";
import { isIOS, isStandalone } from "@/lib/pwa";

// Minimal shape of the (non-standard) beforeinstallprompt event.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __bip?: BeforeInstallPromptEvent | null;
  }
}

function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // An event captured by the early <script> in layout, before React mounted.
    if (window.__bip) setDeferred(window.__bip);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      window.__bip = null;
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    window.__bip = null;
  }, [deferred]);

  return { canPrompt: !!deferred, promptInstall, installed };
}

// The iOS "Share" glyph (square with an upward arrow) — what users tap in Safari.
function ShareGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3v12M12 3 8.5 6.5M12 3l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10H5.5A1.5 1.5 0 0 0 4 11.5v7A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 18.5 10H17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function InstallPrompt() {
  const { canPrompt, promptInstall, installed } = useInstallPrompt();
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setIos(isIOS());
    setStandalone(isStandalone());
  }, []);

  if (standalone || installed) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-sage/15 text-sage">
          <CheckCircle2 size={30} aria-hidden />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
          You&apos;re all set
        </h2>
        <p className="mt-2 text-muted-foreground">
          Junior is installed on this device.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm text-center">
      <h2 className="font-display text-2xl font-bold tracking-tight">
        Keep Junior one tap away
      </h2>
      <p className="mt-2 text-muted-foreground">
        Add it to your home screen so it opens like a normal app — no link to
        dig up later.
      </p>

      {ios ? (
        <ol className="mt-7 flex flex-col gap-4 text-left">
          <li className="flex items-center gap-3">
            <span className="shrink-0 grid place-items-center w-8 h-8 rounded-full bg-surface border border-surface-border text-sm font-semibold tabular-nums">
              1
            </span>
            <span className="text-sm">
              Tap the{" "}
              <span className="inline-flex items-center align-middle mx-0.5 text-accent">
                <ShareGlyph className="w-5 h-5" />
              </span>{" "}
              <span className="font-medium">Share</span>
              {" button in Safari’s toolbar."}
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="shrink-0 grid place-items-center w-8 h-8 rounded-full bg-surface border border-surface-border text-sm font-semibold tabular-nums">
              2
            </span>
            <span className="text-sm">
              Choose{" "}
              <span className="font-medium">Add to Home Screen</span>.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="shrink-0 grid place-items-center w-8 h-8 rounded-full bg-surface border border-surface-border text-sm font-semibold tabular-nums">
              3
            </span>
            <span className="text-sm">
              Tap <span className="font-medium">Add</span> — done!
            </span>
          </li>
        </ol>
      ) : canPrompt ? (
        <button
          onClick={() => void promptInstall()}
          className="mt-7 w-full rounded-full bg-accent text-accent-foreground py-3.5 text-base font-semibold shadow-sm active:scale-[0.98] transition"
        >
          Install Junior
        </button>
      ) : (
        <div className="mt-7 rounded-2xl border border-surface-border bg-surface p-4 text-sm text-left flex items-start gap-3">
          <span className="shrink-0 grid place-items-center w-8 h-8 rounded-full bg-surface border border-surface-border">
            <MoreVertical size={18} aria-hidden />
          </span>
          <span>
            Open your browser&apos;s menu and tap{" "}
            <span className="font-medium">Install app</span> (or{" "}
            <span className="font-medium">Add to Home screen</span>).
          </span>
        </div>
      )}
    </div>
  );
}
