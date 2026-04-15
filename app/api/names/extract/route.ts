import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const NameSchema = z.object({
  name: z.string().describe("The baby name, capitalized properly"),
  meaning: z
    .string()
    .optional()
    .describe("Meaning of the name if mentioned or known"),
  origin: z
    .string()
    .optional()
    .describe("Cultural or linguistic origin if mentioned or known"),
  description: z
    .string()
    .optional()
    .describe("Any other context from the source text about this name"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const { output: extracted } = await generateText({
    model: "anthropic/claude-sonnet-4.5",
    output: Output.object({
      schema: z.object({ names: z.array(NameSchema) }),
    }),
    prompt: `Extract all baby boy names from the following text. For each name, include its meaning, origin, and any other relevant context mentioned. Only extract names — do not invent information not present or implied in the text.\n\nText:\n${body.text}`,
  });

  const names = extracted.names;
  if (names.length === 0) {
    return NextResponse.json({ names: [] });
  }

  // Dedupe against existing rows. COLLATE NOCASE on the `name` column makes
  // the IN comparison case-insensitive server-side.
  const placeholders = names.map(() => "?").join(",");
  const existing = await db.execute({
    sql: `SELECT name FROM names WHERE name IN (${placeholders})`,
    args: names.map((n) => n.name),
  });
  const existingSet = new Set(
    existing.rows.map((r) => String(r.name).toLowerCase()),
  );

  const annotated = names.map((n) => ({
    name: n.name,
    meaning: n.meaning,
    origin: n.origin,
    description: n.description,
    existing: existingSet.has(n.name.toLowerCase()),
  }));

  return NextResponse.json({ names: annotated });
}
