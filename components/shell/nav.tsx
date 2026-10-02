"use client";

import { Buildings, EnvelopeSimple, Gauge, ListMagnifyingGlass, UserGear, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Overzicht", icon: Gauge, match: (p: string) => p === "/" },
  { href: "/tenants", label: "Tenants", icon: Buildings, match: (p: string) => p.startsWith("/tenants") || p.startsWith("/support") },
  { href: "/beheerders", label: "Beheerders", icon: UsersThree, match: (p: string) => p.startsWith("/beheerders") },
  { href: "/audit", label: "Auditlog", icon: ListMagnifyingGlass, match: (p: string) => p.startsWith("/audit") },
  { href: "/instellingen/e-mail", label: "E-mail", icon: EnvelopeSimple, match: (p: string) => p.startsWith("/instellingen/e-mail") },
  { href: "/account", label: "Mijn account", icon: UserGear, match: (p: string) => p.startsWith("/account") },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Hoofdnavigatie" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors",
              active ? "bg-graphite text-paper" : "text-shell-text hover:bg-graphite/60 hover:text-paper",
            )}
          >
            <Icon className={cn("size-5", active ? "text-volt" : "text-shell-dim")} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
