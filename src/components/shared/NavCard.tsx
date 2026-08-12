"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import type { ReactNode } from "react";

export type NavCardItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: { label: string; tone: "neutral" | "green" | "red" | "amber" | "cyan" | "violet" };
  exact?: boolean;
};

export function NavCard({ href, label, icon, badge, exact = false }: NavCardItem) {
  const pathname = usePathname();
  const isActive = href.startsWith("#")
    ? false
    : exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition sm:p-4 ${
        isActive
          ? "border-brand-cyan/40 bg-white/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue via-brand-cyan to-brand-violet text-white shadow-lg shadow-black/20 sm:h-12 sm:w-12">
        {icon}
      </div>
      <p className="text-sm font-semibold leading-tight sm:text-[15px]">{label}</p>
      {badge && (
        <Badge tone={badge.tone} className="mt-0.5">
          {badge.label}
        </Badge>
      )}
    </Link>
  );
}
