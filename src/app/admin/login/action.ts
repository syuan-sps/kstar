"use server";
import { redirect } from "next/navigation";
import { signInAdmin } from "@/lib/admin-auth";

export async function loginAction(formData: FormData) {
  const ok = await signInAdmin(String(formData.get("password") ?? ""));
  redirect(ok ? "/admin" : "/admin/login?e=1");
}
