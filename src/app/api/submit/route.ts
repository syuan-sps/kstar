// src/app/api/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateIntake, hashIp } from "@/lib/submissions";
import { supabaseAdmin, SUBMISSIONS_BUCKET, isPortalConfigured } from "@/lib/supabase";
import { getArtist } from "@/lib/data";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Map([["image/jpeg", "jpg"], ["image/png", "png"]]);

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // captcha optional in dev
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const j = (await r.json()) as { success: boolean };
  return j.success === true;
}

// in-memory hourly rate limit (per server instance; best-effort)
const hits = new Map<string, { n: number; ts: number }>();
function rateLimited(ipHash: string): boolean {
  const now = Date.now();
  const slot = hits.get(ipHash);
  if (!slot || now - slot.ts > 3_600_000) { hits.set(ipHash, { n: 1, ts: now }); return false; }
  slot.n += 1;
  return slot.n > 5;
}

export async function POST(req: NextRequest) {
  if (!isPortalConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  const ipHash = hashIp(ip, process.env.IP_HASH_SALT ?? "dev-salt");
  if (rateLimited(ipHash)) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const form = await req.formData();
  const v = validateIntake(
    { idolId: form.get("idolId"), sourceUrl: form.get("sourceUrl"), license: form.get("license") },
    () => true, // shallow; real existence checked below
  );
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  if (!(await getArtist(v.idolId))) return NextResponse.json({ error: "unknown idol" }, { status: 400 });

  const token = String(form.get("turnstileToken") ?? "");
  if (!(await verifyTurnstile(token, ip))) return NextResponse.json({ error: "captcha failed" }, { status: 400 });

  const file = form.get("photo");
  if (!(file instanceof File)) return NextResponse.json({ error: "photo required" }, { status: 400 });
  const ext = ALLOWED.get(file.type);
  if (!ext) return NextResponse.json({ error: "jpg/png only" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file too large" }, { status: 400 });

  const sb = supabaseAdmin()!;
  const id = crypto.randomUUID();
  const path = `pending/${id}.${ext}`;
  const up = await sb.storage.from(SUBMISSIONS_BUCKET).upload(path, file, { contentType: file.type });
  if (up.error) return NextResponse.json({ error: "upload failed" }, { status: 502 });

  const credit = (form.get("credit") as string | null)?.trim() || null;
  const ins = await sb.from("photo_submissions").insert({
    id, idol_id: v.idolId, status: "pending", storage_path: path,
    source_url: v.sourceUrl, license: v.license, credit, submitter_ip_hash: ipHash,
  });
  if (ins.error) return NextResponse.json({ error: "save failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
