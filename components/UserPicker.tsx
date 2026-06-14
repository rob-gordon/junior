"use client";

import { setCurrentUser, type User } from "@/lib/user";
import { participantName } from "@/lib/participants";

export default function UserPicker({ onPick }: { onPick: (user: User) => void }) {
  function pick(user: User) {
    setCurrentUser(user);
    onPick(user);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Junior</h1>
        <p className="mt-2 text-muted-foreground">Who's using this device?</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => pick("user1")}
          className="rounded-2xl bg-accent text-accent-foreground py-5 text-2xl font-semibold shadow-sm active:scale-[0.98] transition"
        >
          I'm {participantName("user1")}
        </button>
        <button
          onClick={() => pick("user2")}
          className="rounded-2xl bg-surface border border-surface-border py-5 text-2xl font-semibold shadow-sm active:scale-[0.98] transition"
        >
          I'm {participantName("user2")}
        </button>
      </div>
    </div>
  );
}
