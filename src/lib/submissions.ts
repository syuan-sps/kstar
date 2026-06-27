// src/lib/submissions.ts
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { supabaseAdmin, SUBMISSIONS_BUCKET, isPortalConfigured } from "./supabase";

export const LICENSES = ["cc-by", "cc-by-sa", "cc0-pd", "own"] as const;
export type License = (typeof LICENSES)[number];
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface PhotoSubmission {
  id: string;
  idol_id: string;
  status: SubmissionStatus;
  storage_path: string;
  source_url: string;
  license: License;
  credit: string | null;
  image_focus: number;
  submitter_ip_hash: string;
  created_at: string;
  reviewed_at: string | null;
  reject_reason: string | null;
}

export function isValidLicense(v: unknown): v is License {
  return typeof v === "string" && (LICENSES as readonly string[]).includes(v);
}

// Hosts whose images are almost never free-licensed. Used only to FLAG for the
// owner (approve is dimmed, not blocked) — the human still makes the call.
const NON_FREE_HOSTS = [
  "instagram.com", "twitter.com", "x.com", "facebook.com", "tiktok.com",
  "weibo.com", "naver.com", "pinterest.", "tumblr.com", "soompi.com",
  "koreaboo.com", "allkpop.com", "dispatch.",
];

export function looksNonFree(sourceUrl: string): boolean {
  let host: string;
  try {
    host = new URL(sourceUrl).hostname.toLowerCase();
  } catch {
    return true; // unparseable source ⇒ treat as suspect
  }
  return NON_FREE_HOSTS.some((h) => host.includes(h));
}

export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export const APPROVED_PHOTOS_TAG = "approved-photos";

async function queryApprovedPhotos(): Promise<Map<string, { url: string; focus: number }>> {
  const sb = supabaseAdmin();
  if (!sb) return new Map();
  const { data, error } = await sb
    .from("photo_submissions")
    .select("idol_id, storage_path, image_focus, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error || !data) return new Map();
  const map = new Map<string, { url: string; focus: number }>();
  for (const row of data) {
    if (map.has(row.idol_id)) continue; // newest already taken (desc order)
    const { data: pub } = sb.storage.from(SUBMISSIONS_BUCKET).getPublicUrl(row.storage_path);
    map.set(row.idol_id, { url: pub.publicUrl, focus: row.image_focus ?? 0.3 });
  }
  return map;
}

export function getApprovedPhotos(): Promise<Map<string, { url: string; focus: number }>> {
  if (!isPortalConfigured()) return Promise.resolve(new Map());
  // Cache so we don't hit Supabase on every render; busted on approve/reject.
  return unstable_cache(queryApprovedPhotos, ["approved-photos"], {
    revalidate: 60,
    tags: [APPROVED_PHOTOS_TAG],
  })();
}

export function validateIntake(
  input: { idolId: unknown; sourceUrl: unknown; license: unknown },
  idolExists: (id: string) => boolean,
):
  | { ok: true; idolId: string; sourceUrl: string; license: License }
  | { ok: false; error: string } {
  const { idolId, sourceUrl, license } = input;
  if (typeof idolId !== "string" || !idolExists(idolId)) return { ok: false, error: "unknown idol" };
  if (typeof sourceUrl !== "string" || !/^https?:\/\//.test(sourceUrl.trim())) return { ok: false, error: "source url required" };
  if (!isValidLicense(license)) return { ok: false, error: "license required" };
  return { ok: true, idolId, sourceUrl: sourceUrl.trim(), license };
}
