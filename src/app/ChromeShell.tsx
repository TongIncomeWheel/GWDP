"use client";

import { usePathname } from "next/navigation";

const PATH_LABELS: Record<string, string> = {
  "/": "oral-hero/practice",
  "/history": "oral-hero/history",
  "/parent": "oral-hero/parent",
  "/parent/settings": "oral-hero/parent/settings",
};

export default function ChromeShell() {
  const pathname = usePathname();

  const pathLabel =
    PATH_LABELS[pathname] ||
    (pathname.startsWith("/practice/")
      ? "oral-hero/practice/exercise"
      : pathname.startsWith("/results/")
      ? "oral-hero/results"
      : pathname.startsWith("/parent/session/")
      ? "oral-hero/parent/session"
      : "oral-hero");

  return (
    <div className="chrome-shell">
      <div className="chrome-tabs">
        <div className="chrome-tab">PSLE Oral Hero</div>
      </div>
      <div className="chrome-address-bar">
        <div className="chrome-nav-btns">
          <span>&#8592;</span>
          <span>&#8594;</span>
          <span>&#8635;</span>
        </div>
        <div className="chrome-url">
          <span className="chrome-lock">&#128274;</span>
          {pathLabel}
        </div>
      </div>
    </div>
  );
}
