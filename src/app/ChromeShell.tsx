"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const PATH_LABELS: Record<string, string> = {
  "/": "student/practice",
  "/history": "student/history",
  "/parent": "parent/dashboard",
  "/parent/settings": "parent/settings",
};

export default function ChromeShell() {
  const pathname = usePathname();

  const pathLabel =
    PATH_LABELS[pathname] ||
    (pathname.startsWith("/practice/")
      ? "student/practice/exercise"
      : pathname.startsWith("/results/")
      ? "student/results"
      : pathname.startsWith("/parent/session/")
      ? "parent/session"
      : "student");

  const navItems = [
    { href: "/", label: "Practice", active: pathname === "/" || pathname.startsWith("/practice/") },
    { href: "/history", label: "History", active: pathname === "/history" || pathname.startsWith("/results/") },
    { href: "/parent", label: "Parent", active: pathname.startsWith("/parent") },
  ];

  return (
    <div className="chrome-shell">
      {/* Tab Row */}
      <div className="chrome-tabs-row">
        <div className="chrome-tab">
          <div className="chrome-tab-favicon" />
          PSLE Oral Practice Portal
          <span className="chrome-tab-close">&times;</span>
        </div>
      </div>

      {/* Address Bar */}
      <div className="chrome-address-row">
        <div className="chrome-nav-btns">
          <span>&#8592;</span>
          <span className="disabled">&#8594;</span>
          <span>&#8635;</span>
        </div>
        <div className="chrome-url-bar">
          <span className="chrome-lock">&#128274;</span>
          https://psle-oral-hero.edu.sg/{pathLabel}
        </div>
      </div>

      {/* Web Navigation Header */}
      <div className="web-nav-header">
        <div className="web-nav-brand">
          <span className="brand-icon">&#127979;</span>
          PSLE Oral Hero Portal
        </div>
        <div className="web-nav-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`web-nav-link ${item.active ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
