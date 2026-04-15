import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
  const user = body.user;
  const vote = body.vote;

  if (user !== "rob" && user !== "camille") {
    return NextResponse.json({ error: "invalid user" }, { status: 400 });
  }
  if (vote !== "yes" && vote !== "no") {
    return NextResponse.json({ error: "invalid vote" }, { status: 400 });
  }

  const column = user === "rob" ? "rob_vote" : "camille_vote";
  const result = await db.execute({
    sql: `UPDATE names SET ${column} = ? WHERE id = ?`,
    args: [vote, numericId],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "name not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
