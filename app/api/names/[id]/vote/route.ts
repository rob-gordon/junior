import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUser, VOTE_COL } from "@/lib/user";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = (await request.json()) as { user?: string; vote?: string };
  const user = body.user ?? null;
  const vote = body.vote;

  if (!isUser(user)) {
    return NextResponse.json({ error: "invalid user" }, { status: 400 });
  }
  if (vote !== "yes" && vote !== "no") {
    return NextResponse.json({ error: "invalid vote" }, { status: 400 });
  }

  const column = VOTE_COL[user];

  // Transition guard: only UPDATE when the value actually changes, so idempotent
  // re-votes are no-ops and match celebration only fires on a real transition.
  const result = await db.execute({
    sql: `UPDATE names SET ${column} = ?
          WHERE id = ? AND (${column} IS NULL OR ${column} != ?)
          RETURNING user1_vote, user2_vote`,
    args: [vote, numericId, vote],
  });

  if (result.rowsAffected === 0) {
    // Either the id doesn't exist, or the value was already set. Distinguish.
    const exists = await db.execute({
      sql: "SELECT 1 FROM names WHERE id = ?",
      args: [numericId],
    });
    if (exists.rows.length === 0) {
      return NextResponse.json({ error: "name not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, match: false });
  }

  const row = result.rows[0];
  const isMatch =
    vote === "yes" &&
    row.user1_vote === "yes" &&
    row.user2_vote === "yes";

  return NextResponse.json({ ok: true, match: isMatch });
}
