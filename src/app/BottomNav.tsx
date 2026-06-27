"use client";

import Link from "next/link";

export default function BottomNav({ active }: { active: "home" | "history" | "rubric" | "parent" }) {
  return (
    <nav className="nav-bottom">
      <Link href="/" className={active === "home" ? "active" : ""}>
        <span className="nav-icon">&#x1F4DD;</span>
        Practice
      </Link>
      <Link href="/history" className={active === "history" ? "active" : ""}>
        <span className="nav-icon">&#x1F4CA;</span>
        History
      </Link>
      <Link href="/rubric" className={active === "rubric" ? "active" : ""}>
        <span className="nav-icon">&#x1F4D6;</span>
        Rubric
      </Link>
      <Link href="/parent" className={active === "parent" ? "active" : ""}>
        <span className="nav-icon">&#x1F512;</span>
        Parent
      </Link>
    </nav>
  );
}
