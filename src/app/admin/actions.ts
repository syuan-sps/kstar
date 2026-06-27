"use server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin, SUBMISSIONS_BUCKET } from "@/lib/supabase";
import { APPROVED_PHOTOS_TAG } from "@/lib/submissions";

export async function approveAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sb = supabaseAdmin();
  if (!sb) redirect("/admin");
  const id = String(formData.get("id"));
  const focus = Number(formData.get("imageFocus") ?? 0.3);

  const { data: row } = await sb.from("photo_submissions").select("idol_id, storage_path").eq("id", id).single();
  if (!row) redirect("/admin");
  const ext = row.storage_path.split(".").pop() ?? "jpg";
  const dest = `approved/${row.idol_id}.${ext}`;
  // copy pending → approved (overwrite any prior approved photo for this idol)
  await sb.storage.from(SUBMISSIONS_BUCKET).copy(row.storage_path, dest).catch(() => {});
  await sb.storage.from(SUBMISSIONS_BUCKET).remove([dest]).then(() =>
    sb.storage.from(SUBMISSIONS_BUCKET).copy(row.storage_path, dest)).catch(() => {});

  await sb.from("photo_submissions").update({
    status: "approved", storage_path: dest, image_focus: focus, reviewed_at: new Date().toISOString(),
  }).eq("id", id);

  // demote any other approved row for this idol so newest-wins stays clean
  await sb.from("photo_submissions").update({ status: "rejected", reject_reason: "superseded" })
    .eq("idol_id", row.idol_id).eq("status", "approved").neq("id", id);

  revalidateTag(APPROVED_PHOTOS_TAG, {});
  redirect("/admin");
}

export async function rejectAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sb = supabaseAdmin();
  if (!sb) redirect("/admin");
  const id = String(formData.get("id"));
  const reason = (formData.get("reason") as string | null)?.trim() || null;
  await sb.from("photo_submissions").update({ status: "rejected", reject_reason: reason, reviewed_at: new Date().toISOString() }).eq("id", id);
  revalidateTag(APPROVED_PHOTOS_TAG, {});
  redirect("/admin");
}
