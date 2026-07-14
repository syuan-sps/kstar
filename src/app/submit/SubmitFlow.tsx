"use client";
import { useMemo, useState } from "react";
import Script from "next/script";
import Thumb from "@/components/Thumb";
import { LICENSES, type License } from "@/lib/submissions";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";

export interface SubmitArtist {
  id: string; name: string; name_zh: string | null; group: string | null;
  image_url: string | null; image_focus: number | null; hasPhoto: boolean;
}

export default function SubmitFlow({ artists, turnstileSiteKey, initialIdolId }: { artists: SubmitArtist[]; turnstileSiteKey: string | null; initialIdolId?: string | null }) {
  const copy = useCopy();
  const locale = useLocale();
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
      <div className="text-center font-orbitron text-[10px] font-bold tracking-[0.3em] text-[#7c8088]">{copy.submitBadge}</div>
      <h1 className="mt-2 text-center text-2xl font-black text-[#1c1e24]">{copy.submitTitle}</h1>
      <p className="mt-1 text-center text-sm text-[#5e636d]">{copy.submitSub}</p>

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
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy.submitSearchPlaceholder}
          className="w-full rounded-full border-2 border-[#c8ccd2] bg-white px-4 py-2 text-sm" />
        {results.length > 0 && (
          <div className="mt-2 divide-y divide-[#eceef2] rounded-2xl border border-[#c8ccd2] bg-white">
            {results.map((a) => (
              <button key={a.id} onClick={() => setSelected(a)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm">
                <span className="font-bold text-[#1c1e24]">{a.name}</span>
                {locale === "zh" && <span className="text-xs text-[#9aa0aa]">{a.name_zh}</span>}
                {!a.hasPhoto && <span className="ml-auto rounded-full bg-[#b4302b] px-2 py-0.5 text-[9px] font-bold text-white">{copy.submitMissingTag}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SubmitForm({ artist, onBack, turnstileSiteKey }: { artist: SubmitArtist; onBack: () => void; turnstileSiteKey: string | null }) {
  const copy = useCopy();
  const locale = useLocale();
  const LICENSE_LABEL: Record<License, string> = {
    "cc-by": "CC BY", "cc-by-sa": "CC BY-SA", "cc0-pd": "CC0／PD", own: copy.licenseOwn,
  };
  const [license, setLicense] = useState<License>("cc-by");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy"); setMsg("");
    const fd = new FormData(e.currentTarget);
    fd.set("idolId", artist.id);
    fd.set("license", license);
    const r = await fetch("/api/submit", { method: "POST", body: fd });
    if (r.ok) { setState("done"); return; }
    const j = await r.json().catch(() => ({ error: copy.submitErrorDefault }));
    setState("error"); setMsg(j.error ?? copy.submitErrorDefault);
  }

  if (state === "done") {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <div className="font-orbitron text-sm font-bold tracking-widest text-[#b4302b]">{copy.submitSuccessBadge}</div>
        <p className="mt-3 text-sm text-[#5e636d]">{copy.submitSuccessMsg(artist.name)}</p>
        <button onClick={onBack} className="mt-6 rounded-full border border-[#c8ccd2] px-4 py-2 text-sm font-bold">{copy.submitAgain}</button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <button onClick={onBack} className="font-orbitron text-[10px] font-bold tracking-widest text-[#7c8088]">{copy.submitChangeIdol}</button>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-[#b4302b] bg-white p-3 shadow-[2px_2px_0_#b4302b]">
        <div className="h-12 w-10 overflow-hidden rounded-lg border border-[#c8ccd2]">
          <Thumb src={artist.image_url} seed={artist.id} label={artist.name} rounded="rounded-none" focusY={artist.image_focus} />
        </div>
        <div><div className="font-black text-[#1c1e24]">{artist.name}</div><div className="text-[10px] text-[#9aa0aa]">{artist.group}{locale === "zh" && artist.name_zh ? ` · ${artist.name_zh}` : ""}</div></div>
        <span className="ml-auto font-orbitron text-[10px] font-bold text-[#b4302b]">{copy.submitSelected}</span>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9aa0aa]">{copy.submitPhotoLabel}
          <input name="photo" type="file" accept="image/jpeg,image/png" required className="mt-1 block w-full text-sm" />
        </label>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9aa0aa]">{copy.submitSourceLabel}
          <input name="sourceUrl" type="url" required placeholder="https://commons.wikimedia.org/…" className="mt-1 w-full rounded-lg border-2 border-[#c8ccd2] px-3 py-2 text-sm" />
        </label>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#9aa0aa]">{copy.submitLicenseLabel}
          <div className="mt-1 flex flex-wrap gap-2">
            {LICENSES.map((l) => (
              <button key={l} type="button" onClick={() => setLicense(l)}
                className={`rounded-full border px-3 py-1 text-xs font-bold ${license === l ? "border-[#b4302b] bg-[#b4302b] text-white" : "border-[#c8ccd2] bg-white text-[#5e636d]"}`}>
                {LICENSE_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9aa0aa]">{copy.submitCreditLabel}
          <input name="credit" placeholder={copy.submitCreditPlaceholder} className="mt-1 w-full rounded-lg border-2 border-[#c8ccd2] px-3 py-2 text-sm" />
        </label>
        {turnstileSiteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
        {turnstileSiteKey && <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-response-field-name="turnstileToken" />}
        <button disabled={state === "busy"} className="w-full rounded-full bg-[#b4302b] py-3 text-sm font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.35)] disabled:opacity-50">
          {state === "busy" ? copy.submitBtnBusy : copy.submitBtnIdle}
        </button>
        {state === "error" && <p className="text-center text-xs text-[#b4302b]">{msg}</p>}
      </form>
    </main>
  );
}
