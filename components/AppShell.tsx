"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCurrentUser, type User } from "@/lib/user";
import { hasOnboarded, markOnboarded } from "@/lib/onboarding";
import { isStandalone } from "@/lib/pwa";
import UserPicker from "./UserPicker";
import Onboarding from "./Onboarding";
import HowItWorks from "./HowItWorks";
import InstallPrompt from "./InstallPrompt";
import BottomNav from "./BottomNav";
import OfflineBanner from "./OfflineBanner";

type Overlay = "how" | "install" | null;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [onboarded, setOnboarded] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    const u = getCurrentUser();
    // People already using the app (identity set, but no onboarding flag from
    // before this feature shipped) shouldn't be dragged through the intro.
    if (u && !hasOnboarded()) markOnboarded();
    setUser(u);
    setOnboarded(hasOnboarded());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="flex-1" />;
  }

  if (!onboarded) {
    return (
      <Onboarding
        onComplete={(u) => {
          markOnboarded();
          setUser(u);
          setOnboarded(true);
        }}
      />
    );
  }

  if (!user) {
    return <UserPicker onPick={setUser} />;
  }

  const canInstall = !isStandalone();

  return (
    <>
      <OfflineBanner />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav
        currentUser={user}
        canInstall={canInstall}
        onHowItWorks={() => setOverlay("how")}
        onInstall={() => setOverlay("install")}
      />

      {overlay && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="max-w-md mx-auto min-h-full flex flex-col px-6 py-5">
            <button
              onClick={() => setOverlay(null)}
              aria-label="Close"
              className="self-end grid place-items-center w-9 h-9 rounded-full text-muted-foreground hover:bg-surface-border/60"
            >
              <X size={20} />
            </button>
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              {overlay === "how" ? (
                <HowItWorks user={user} />
              ) : (
                <InstallPrompt />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
