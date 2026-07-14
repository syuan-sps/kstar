import type { ReactNode } from "react";

export default function OSWindow({
  title,
  icon,
  className = "",
  bodyClassName = "",
  children,
}: {
  title: string;
  icon?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`window-frame ${className}`}>
      <div className="title-bar">
        {icon && <span className="mr-1.5 text-base leading-none">{icon}</span>}
        <span className="flex-1 truncate text-xs font-bold tracking-wide">{title}</span>
        <div className="flex gap-0.5">
          <span className="win-btn">_</span>
          <span className="win-btn">□</span>
          <span className="win-btn win-btn-close">×</span>
        </div>
      </div>
      <div className={`window-body ${bodyClassName}`}>{children}</div>
    </div>
  );
}
