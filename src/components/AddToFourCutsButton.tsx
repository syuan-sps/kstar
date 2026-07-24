"use client";

// Artist-page entry into the 人生四格. Mirrors the 圖鑑 ＋ swap, but since there's
// no grid here to point at, it swaps out the oldest pick and shows an undo toast
// naming who came in and who left — so the silent-ejection surprise is gone.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveWizard } from "@/lib/wizardState";
import { useCopy } from "@/lib/i18n/LocaleProvider";

type Toast = { added: string; removed: string; prevIds: string[] };

export default function AddToFourCutsButton({
  id,
  name,
  nameById,
}: {
  id: string;
  name: string;
  nameById: Record<string, string>;
}) {
  const copy = useCopy();
  const router = useRouter();
  const [inFour, setInFour] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readMembership = useCallback(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}") as { topIdols?: string[] };
      setInFour(Array.isArray(prefs.topIdols) && prefs.topIdols.includes(id));
    } catch {
      setInFour(false);
    }
  }, [id]);

  useEffect(() => {
    readMembership();
    window.addEventListener("kstar:prefs-updated", readMembership);
    window.addEventListener("storage", readMembership);
    return () => {
      window.removeEventListener("kstar:prefs-updated", readMembership);
      window.removeEventListener("storage", readMembership);
    };
  }, [readMembership]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function showToast(next: Toast) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  function commit(topIdols: string[]) {
    const prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}");
    localStorage.setItem("kstar:prefs", JSON.stringify({ ...prefs, topIdols }));
    window.dispatchEvent(new Event("kstar:prefs-updated"));
  }

  function add() {
    if (inFour) return;
    try {
      const raw = localStorage.getItem("kstar:prefs");
      const prefs = raw ? (JSON.parse(raw) as { topIdols?: string[] }) : {};
      const current = Array.isArray(prefs.topIdols) ? prefs.topIdols : [];
      // No complete lineup yet → send them to build one, seeded with what's there.
      if (current.length !== 4) {
        saveWizard({ picks: current, step: 1 });
        router.push("/start?step=1");
        return;
      }
      if (current.includes(id)) { setInFour(true); return; }
      const removed = current[0];
      commit([...current.slice(1), id]);
      showToast({ added: name, removed: nameById[removed] ?? removed, prevIds: current });
    } catch {
      saveWizard({ picks: [], step: 1 });
      router.push("/start?step=1");
    }
  }

  function undo() {
    if (!toast) return;
    commit(toast.prevIds);
    setToast(null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={add}
        aria-pressed={inFour}
        className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
          inFour
            ? "cursor-default border-[#b4302b]/40 bg-[#b4302b]/10 text-[#b4302b]"
            : "border-[#c8ccd2] bg-white text-[#1c1e24] hover:border-[#b4302b] hover:text-[#b4302b]"
        }`}
      >
        {inFour ? copy.inFourCut : copy.addToFourCut}
      </button>
      {toast && (
        <span role="status" className="absolute left-0 top-full z-50 mt-2 flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#1c1e24] px-3 py-1.5 text-[11px] font-medium text-white shadow-lg">
          {copy.fourCutSwapToast(toast.added, toast.removed)}
          <button type="button" onClick={undo} className="font-bold text-[#ffb4b0] underline underline-offset-2">
            {copy.undoAction}
          </button>
        </span>
      )}
    </div>
  );
}
