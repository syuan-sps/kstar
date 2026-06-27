import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { loginAction } from "./action";

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="mx-auto max-w-xs px-6 py-24">
      <div className="text-center font-orbitron text-[10px] font-bold tracking-[0.3em] text-[#7c8088]">✦ 審核台登入 ✦</div>
      <form action={loginAction} className="mt-5 space-y-3">
        <input name="password" type="password" required placeholder="管理密碼" className="w-full rounded-lg border-2 border-[#c8ccd2] px-3 py-2 text-sm" />
        <button className="w-full rounded-full bg-[#b4302b] py-2.5 text-sm font-bold text-white">登入</button>
      </form>
    </main>
  );
}
