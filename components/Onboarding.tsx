"use client";

import { useState } from "react";
import type { User } from "@/lib/user";
import UserPicker from "./UserPicker";
import HowItWorks from "./HowItWorks";
import InstallPrompt from "./InstallPrompt";

type Step = "pick" | "how" | "install";

// First-run intro for new devices: pick who you are -> how it works -> install.
// Identity is persisted by UserPicker; AppShell marks onboarding complete.
export default function Onboarding({
  onComplete,
}: {
  onComplete: (user: User) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<Step>("pick");

  if (step === "pick") {
    return (
      <UserPicker
        onPick={(u) => {
          setUser(u);
          setStep("how");
        }}
      />
    );
  }

  // user is guaranteed set once we're past the pick step.
  const picked = user as User;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {step === "how" ? <HowItWorks user={picked} /> : <InstallPrompt />}
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        {step === "how" ? (
          <>
            <button
              onClick={() => setStep("install")}
              className="rounded-full bg-accent text-accent-foreground py-3.5 text-base font-semibold shadow-sm active:scale-[0.98] transition"
            >
              Next
            </button>
            <button
              onClick={() => onComplete(picked)}
              className="text-sm text-muted-foreground py-1"
            >
              Skip
            </button>
          </>
        ) : (
          // On the install step the install affordance is the primary action,
          // so "continue into the app" is a secondary button.
          <button
            onClick={() => onComplete(picked)}
            className="rounded-full bg-surface border border-surface-border py-3.5 text-base font-semibold active:scale-[0.98] transition"
          >
            Start picking names
          </button>
        )}
      </div>
    </div>
  );
}
