"use client";

import Link from "next/link";

export default function BottomNav({ active }: { active: "home" | "history" }) {
  return (
    <nav className="nav-bottom">
      <Link href="/" className={active === "home" ? "active" : ""}>
        <span className="nav-icon">📝</span>
        Practice
      </Link>
      <Link href="/history" className={active === "history" ? "active" : ""}>
        <span className="nav-icon">📊</span>
        History
      </Link>
    </nav>
  );
}
