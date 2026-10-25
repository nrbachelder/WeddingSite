"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Our Story" },
  { href: "/info", label: "Info" },
  { href: "/rsvp", label: "RSVP" },
];

export default function TabNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex justify-center gap-6 sm:gap-14">
      {tabs.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`border-b pb-1 text-sm uppercase tracking-[0.25em] transition-colors ${
              active ? "border-magenta text-ink" : "border-transparent text-ink hover:text-magenta"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
