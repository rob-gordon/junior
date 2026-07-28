"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/user";
import { participantName } from "@/lib/participants";

const TABS = [
  { href: "/lists", label: "My Lists" },
  { href: "/add", label: "Add" },
  { href: "/matches", label: "Matches" },
] as const;

export default function BottomNav({
  currentUser,
  canInstall,
  onHowItWorks,
  onInstall,
}: {
  currentUser: User;
  canInstall: boolean;
  onHowItWorks: () => void;
  onInstall: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-surface-border bg-surface/95 backdrop-blur">
      <ul className="flex items-stretch justify-around max-w-md mx-auto">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href) ?? false;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center py-3 text-sm font-medium ${
                  active ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pb-1">
        <button onClick={onHowItWorks} className="underline-offset-2 hover:underline">
          How it works
        </button>
        <span aria-hidden>·</span>
        <Link href="/settings" className="underline-offset-2 hover:underline">
          Settings
        </Link>
        {canInstall && (
          <>
            <span aria-hidden>·</span>
            <button onClick={onInstall} className="underline-offset-2 hover:underline">
              Install app
            </button>
          </>
        )}
        <span aria-hidden>·</span>
        <span>signed in as {participantName(currentUser)}</span>
      </div>
    </nav>
  );
}
