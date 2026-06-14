import type { User } from "./user";
import { partnerOf } from "./user";

// Display names per deployment, inlined at build time from NEXT_PUBLIC_* env vars.
// Set NEXT_PUBLIC_USER1_NAME / NEXT_PUBLIC_USER2_NAME in each environment.
export function participantName(slot: User): string {
  return slot === "user1"
    ? (process.env.NEXT_PUBLIC_USER1_NAME ?? "Player 1")
    : (process.env.NEXT_PUBLIC_USER2_NAME ?? "Player 2");
}

export function partnerName(slot: User): string {
  return participantName(partnerOf(slot));
}
