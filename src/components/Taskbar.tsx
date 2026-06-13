"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";

function Clock() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      setTime(`${h}:${m}`);
    };
    fmt();
    const id = setInterval(fmt, 10000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums text-[#7c8088]">{time}</span>;
}

export default function Taskbar() {
  return (
    <div className="taskbar hidden md:flex fixed bottom-0 left-0 right-0 z-30 items-center gap-3 px-4 h-10">
      {/* Start button */}
      <Link
        href="/"
        className="start-btn flex items-center gap-1.5 rounded-full border border-[#b4302b] bg-[#b4302b] px-4 py-1 text-xs font-black text-white shadow-[0_0_10px_rgba(180,48,43,0.4)] hover:brightness-110"
      >
        <span>✦</span>
        <span className="font-orbitron">{copy.startBtn}</span>
      </Link>

      {/* Center label + clock */}
      <div className="flex flex-1 items-center justify-center gap-3 text-xs text-[#5e636d]/70">
        <span className="font-orbitron tracking-widest">{copy.taskbarLabel}</span>
        <span className="text-[#5e636d]/50">|</span>
        <Clock />
      </div>

      {/* Nav icons */}
      <div className="flex items-center gap-1">
        <Link href="/search" className="taskbar-icon" title="搜尋">
          <span>🔍</span>
        </Link>
        <Link href="/favorites" className="taskbar-icon" title="我的收藏">
          <span>♥</span>
        </Link>
      </div>
    </div>
  );
}
