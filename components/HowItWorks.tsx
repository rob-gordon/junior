import { ListPlus, EyeOff, Heart, Trophy, type LucideIcon } from "lucide-react";
import type { User } from "@/lib/user";
import { partnerName } from "@/lib/participants";

// Shared content used both as an onboarding step and as a replayable overlay.
export default function HowItWorks({ user }: { user: User }) {
  const partner = partnerName(user);

  const items: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: ListPlus,
      title: "Start by adding names",
      body: "On the Add tab, type a name or paste a whole list — we'll pull the names out for you.",
    },
    {
      icon: EyeOff,
      title: "Vote in private",
      body: `Tap Yes or No on each name. ${partner} never sees how you voted.`,
    },
    {
      icon: Heart,
      title: "Find your matches",
      body: `When you both say Yes to the same name, it becomes a match.`,
    },
    {
      icon: Trophy,
      title: "Rank the favorites",
      body: "In Matches, tap Compare to choose between two names and sort your top picks.",
    },
  ];

  return (
    <div className="w-full max-w-sm">
      <h2 className="font-display text-3xl font-bold tracking-tight text-center">
        How Junior works
      </h2>
      <ul className="mt-8 flex flex-col gap-5">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex items-start gap-4">
            <div className="shrink-0 grid place-items-center w-11 h-11 rounded-2xl bg-accent/12 text-accent">
              <Icon size={22} strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-snug">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
