import { redirect } from "next/navigation";
import Image from "next/image";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin, SUBMISSIONS_BUCKET } from "@/lib/supabase";
import { getArtist } from "@/lib/data";
import { looksNonFree, type PhotoSubmission } from "@/lib/submissions";
import { approveAction, rejectAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const sb = supabaseAdmin();
  if (!sb) return <main className="p-10 text-center text-sm">投稿後端未設定。</main>;

  const { data } = await sb.from("photo_submissions").select("*").eq("status", "pending").order("created_at", { ascending: true });
  const rows = (data ?? []) as PhotoSubmission[];

  const enriched = await Promise.all(rows.map(async (r) => {
    const artist = await getArtist(r.idol_id);
    const { data: signed } = await sb.storage.from(SUBMISSIONS_BUCKET).createSignedUrl(r.storage_path, 600);
    return { r, artist, pendingUrl: signed?.signedUrl ?? "", flagged: looksNonFree(r.source_url) };
  }));

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="font-orbitron text-[10px] font-bold tracking-[0.24em] text-[#7c8088]">✦ 待審投稿 · {rows.length}</div>
      <div className="mt-4 space-y-4">
        {enriched.map(({ r, artist, pendingUrl, flagged }) => (
          <div key={r.id} className="flex gap-4 rounded-2xl border-2 border-[#c8ccd2] bg-white p-3 shadow-[2px_2px_0_#aeb3bb]">
            <div className="flex gap-2">
              <Image src={pendingUrl} alt="submission" width={74} height={92} className="h-[92px] w-[74px] rounded-lg border-2 border-[#b4302b] object-cover" unoptimized />
              {artist?.image_url
                ? <Image src={artist.image_url} alt="current" width={74} height={92} className="h-[92px] w-[74px] rounded-lg border-2 border-dashed border-[#c8ccd2] object-cover" unoptimized />
                : <div className="flex h-[92px] w-[74px] items-center justify-center rounded-lg border-2 border-dashed border-[#c8ccd2] text-[9px] text-[#9aa0aa]">目前無</div>}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-black text-[#1c1e24]">{artist?.name ?? r.idol_id} <span className="text-[10px] font-bold text-[#9aa0aa]">{artist?.group} · {artist?.image_url ? "替換現有照" : "補缺照 ✦"}</span></div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${flagged ? "bg-[#b88008]" : "bg-[#2f7d4f]"}`}>{flagged ? "授權待查" : r.license.toUpperCase()}</span>
                <span className="text-[#5e636d]">署名：{r.credit ?? "（無）"}</span>
              </div>
              <a href={r.source_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-[#56789f] underline">{r.source_url}</a>
              {flagged && <p className="mt-1 text-[10px] text-[#b88008]">⚠ 出處像非自由授權，請確認後再通過</p>}
            </div>
            <div className="flex flex-col gap-2">
              <form action={approveAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="imageFocus" value="0.3" />
                <button className="rounded-full bg-[#2f7d4f] px-3 py-2 text-[10px] font-bold text-white">✓ 通過上線</button></form>
              <form action={rejectAction}><input type="hidden" name="id" value={r.id} />
                <button className="rounded-full border border-[#b4302b] px-3 py-2 text-[10px] font-bold text-[#b4302b]">✕ 退回</button></form>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="py-16 text-center text-sm text-[#9aa0aa]">沒有待審投稿 ✦</p>}
      </div>
    </main>
  );
}
