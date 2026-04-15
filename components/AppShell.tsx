"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, type User } from "@/lib/user";
import UserPicker from "./UserPicker";
import BottomNav from "./BottomNav";
import OfflineBanner from "./OfflineBanner";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="flex-1" />;
  }

  if (!user) {
    return <UserPicker onPick={setUser} />;
  }

  return (
    <>
      <OfflineBanner />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav currentUser={user} />
    </>
  );
}
