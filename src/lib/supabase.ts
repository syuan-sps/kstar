// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUBMISSIONS_BUCKET = "submissions";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isPortalConfigured(): boolean {
  return Boolean(url && anonKey && serviceKey);
}

export function supabaseAnon(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export function supabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
