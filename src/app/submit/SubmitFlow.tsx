"use client";
import { useMemo, useState } from "react";
import Script from "next/script";
import Thumb from "@/components/Thumb";
import { LICENSES, type License } from "@/lib/submissions";

export interface SubmitArtist {
  id: string; name: string; name_zh: string | null; group: string | null;
  image_url: string | null; image_focus: number | null; hasPhoto: boolean;
}

const LICENSE_LABEL: Record<License, string> = {
  "cc-by": "CC BY", "cc-by-sa": "CC BY-SA", "cc0-pd": "CC0／PD", own: "我本人拍攝",
};

export default function SubmitFlow({ artists, turnstileSiteKey, initialIdolId }: { artists: SubmitArtist[]; turnstileSiteKey: string | null; initialIdolId?: string | null }) {
  // Deep-link from a gap card (/submit?idol=…) opens straight on that idol's form.
  const [selected, setSelected] = useState<SubmitArtist | null>(
    () => (initialIdolId ? artists.find((a) => a.id === initialIdolId) ?? null : null),
  );
  const [query, setQuery] = useState("");
  const gaps = useMemo(() => artists.filter((a) => !a.hasPhoto), [artists]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return artists.filter((a) => a.name.toLowerCase().includes(q) || (a.name_zh ?? "").toLowerCase().includes(q)).slice(0, 12);
  }, [artists, query]);

  if (selected) return <SubmitForm artist={selected} onBack={() => setSelected(null)} turnstileSiteKey={turnstileSiteKey} />;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="text-center font-orbitron text-[10px] font-bold tracking-[0.3em] text-[#7c8088]">✦&nbsp;幫忙補上偶像照片&nbsp;✦</div>
      <h1 className="mt-2 text-center text-2xl font-black text-[#1c1e24]">這些偶像還缺照片</h1>
      <p className="mt-1 text-center text-sm text-[#5e636d]">點一位開始投稿 · 只收自由授權（CC／自有）</p>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {gaps.slice(0, 23).map((a) => (
          <button key={a.id} onClick={() => setSelected(a)} className="flex flex-col items-center">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-[12px] border-2 border-dashed border-[#b9bec6] bg-gradient-to-br from-[#e9ebef] to-[#dfe2e7]">
              <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-none" focusY={a.image_focus} />
            </div>
            <span className="mt-1 truncate text-[9px] font-bold text-[#5e636d]">{a.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 找其他偶像（已有照片也能投替換）…"
          className="w-full rounded-full border-2 border-[#c8ccd2] bg-white px-4 py-2 text-sm" />
        {results.length > 0 && (
          <div className="mt-2 divide-y divide-[#eceef2] rounded-2xl border border-[#c8ccd2] bg-white">
            {results.map((a) => (
              <button key={a.id} onClick={() => setSelected(a)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm">
                <span className="font-bold text-[#1c1e24]">{a.name}</span>
                <span className="text-xs text-[#9aa0aa]">{a.name_zh}</span>
                {!a.hasPhoto && <span className="ml-auto rounded-full bg-[#b4302b] px-2 py-0.5 text-[9px] font-bold text-white">缺照</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SubmitForm({ artist, onBack, turnstileSiteKey }: { artist: SubmitArtist; onBack: () => void; turnstileSiteKey: string | null }) {
  const [license, setLicense] = useState<License>("cc-by");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFileName(f ? f.name : null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy"); setMsg("");
    const fd = new FormData(e.currentTarget);
    fd.set("idolId", artist.id);
    fd.set("license", license);
    const r = await fetch("/api/submit", { method: "POST", body: fd });
    if (r.ok) { setState("done"); return; }
    const j = await r.json().catch(() => ({ error: "送出失敗" }));
    setState("error"); setMsg(j.error ?? "送出失敗");
  }

  if (state === "done") {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <div className="font-orbitron text-sm font-bold tracking-widest text-[#b4302b]">✦ 投稿成功 ✦</div>
        <p className="mt-3 text-sm text-[#5e636d]">{artist.name} 的照片已送出，審核通過後會上線。謝謝你！</p>
        <button onClick={onBack} className="mt-6 rounded-full border border-[#c8ccd2] px-4 py-2 text-sm font-bold">← 再投一位</button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <button onClick={onBack} className="font-orbitron text-[10px] font-bold tracking-widest text-[#7c8088]">← 換一位偶像</button>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-[#b4302b] bg-white p-3 shadow-[2px_2px_0_#b4302b]">
        <div className="h-12 w-10 overflow-hidden rounded-lg border border-[#c8ccd2]">
          <Thumb src={artist.image_url} seed={artist.id} label={artist.name} rounded="rounded-none" focusY={artist.image_focus} />
        </div>
        <div><div className="font-black text-[#1c1e24]">{artist.name}</div><div className="text-[10px] text-[#9aa0aa]">{artist.group} · {artist.name_zh}</div></div>
        <span className="ml-auto font-orbitron text-[10px] font-bold text-[#b4302b]">✓ 已選</span>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#9aa0aa]">照片
          <label
            htmlFor="photo"
            className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-[#c8ccd2] bg-white px-3 py-3 transition hover:border-[#b4302b]"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="預覽" className="h-14 w-11 shrink-0 rounded object-cover" />
            ) : (
              <span className="flex h-14 w-11 shrink-0 items-center justify-center rounded bg-[#eceef2] text-xl text-[#9aa0aa]">＋</span>
            )}
            <span className="flex-1 truncate text-sm font-medium normal-case tracking-normal text-[#1c1e24]">
              {fileName ?? "選擇照片"}
            </span>
            <span className="shrink-0 rounded-full bg-[#7c8088]/90 px-3 py-1 text-[11px] font-bold normal-case tracking-normal text-white">
              {fileName ? "更換" : "瀏覽"}
            </span>
          </label>
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png" required onChange={onPickFile} className="sr-only" />
          <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-[#9aa0aa]">JPG／PNG · 單人正面為佳</p>
        </div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9aa0aa]">出處連結（必填）
          <input name="sourceUrl" type="url" required placeholder="https://commons.wikimedia.org/…" className="mt-1 w-full rounded-lg border-2 border-[#c8ccd2] px-3 py-2 text-sm" />
        </label>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#9aa0aa]">授權
          <div className="mt-1 flex flex-wrap gap-2">
            {LICENSES.map((l) => (
              <button key={l} type="button" onClick={() => setLicense(l)}
                className={`rounded-full border px-3 py-1 text-xs font-bold ${license === l ? "border-[#b4302b] bg-[#b4302b] text-white" : "border-[#c8ccd2] bg-white text-[#5e636d]"}`}>
                {LICENSE_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9aa0aa]">署名（選填）
          <input name="credit" placeholder="你的名字／IG，會顯示為 credit" className="mt-1 w-full rounded-lg border-2 border-[#c8ccd2] px-3 py-2 text-sm" />
        </label>
        {turnstileSiteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
        {turnstileSiteKey && <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-response-field-name="turnstileToken" />}
        <button disabled={state === "busy"} className="w-full rounded-full bg-[#b4302b] py-3 text-sm font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.35)] disabled:opacity-50">
          {state === "busy" ? "送出中…" : "送出投稿 → 等待審核"}
        </button>
        {state === "error" && <p className="text-center text-xs text-[#b4302b]">{msg}</p>}
      </form>
    </main>
  );
}
