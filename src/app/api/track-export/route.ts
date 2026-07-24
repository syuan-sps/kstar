// src/app/api/track-export/route.ts
// Durable, queryable download-count tracking for card exports, alongside the
// existing Vercel Analytics "export" event fired from src/lib/exportImage.ts.
// Public write-only endpoint (no auth): validates the enum inputs to keep out
// junk, then inserts via the service-role client. Fire-and-forget by design —
// callers should never let a failure here block the download/share UX.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const CARDS = new Set(["fourcut", "report", "fanid", "story"]);
const ACTIONS = new Set(["download", "share"]);
const MAX_LOCALE_LEN = 16;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { card, action, locale } = body as Record<string, unknown>;
  if (typeof card !== "string" || !CARDS.has(card)) {
    return NextResponse.json({ error: "invalid card" }, { status: 400 });
  }
  if (typeof action !== "string" || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  let localeValue: string | null = null;
  if (locale !== undefined && locale !== null) {
    if (typeof locale !== "string" || locale.length > MAX_LOCALE_LEN) {
      return NextResponse.json({ error: "invalid locale" }, { status: 400 });
    }
    localeValue = locale;
  }

  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false }, { status: 503 });

  // Fire-and-forget: a failed insert never surfaces as an error to the caller.
  const ins = await sb.from("download_events").insert({ card, action, locale: localeValue });
  if (ins.error) return NextResponse.json({ ok: false }, { status: 200 });
  return NextResponse.json({ ok: true });
}
