"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav({ active }: { active: "home" | "history" | "rubric" | "parent" }) {
  const pathname = usePathname();
  const isZh = pathname.startsWith("/zh");

  if (isZh) {
    return (
      <nav className="nav-bottom">
        <Link href="/zh" className={pathname === "/zh" ? "active" : ""}>
          <span className="nav-icon">&#x1F4DD;</span>
          Practice
        </Link>
        <Link href="/zh/history" className={pathname === "/zh/history" ? "active" : ""}>
          <span className="nav-icon">&#x1F4CA;</span>
          History
        </Link>
        <Link href="/zh/rubric" className={pathname === "/zh/rubric" ? "active" : ""}>
          <span className="nav-icon">&#x1F4D6;</span>
          Rubric
        </Link>
        <Link href="/zh/parent" className={pathname === "/zh/parent" || pathname.startsWith("/zh/parent/") ? "active" : ""}>
          <span className="nav-icon">&#x1F512;</span>
          Parent
        </Link>
        <Link href="/" className="">
          <span className="nav-icon">&#x1F1EC;&#x1F1E7;</span>
          English
        </Link>
      </nav>
    );
  }

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
      <Link href="/zh" className="">
        <span className="nav-icon">&#x1F4DA;</span>
        &#x534E;&#x6587;
      </Link>
    </nav>
  );
}
