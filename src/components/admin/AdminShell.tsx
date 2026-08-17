"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Flag, Gauge, LogOut, Users } from "lucide-react";
import { Brand } from "@/components/Brand";
import { logoutAdminUser } from "@/lib/admin/client";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/athletes", label: "Atletas", icon: Users },
  { href: "/admin/races", label: "Provas", icon: Flag },
  { href: "/admin/tracking-sessions", label: "Tracking", icon: Activity },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="screen admin-screen">
      <div className="app-frame admin-frame">
        <header className="admin-topbar">
          <Brand />
          <button type="button" className="secondary-button admin-logout" onClick={logoutAdminUser}>
            <LogOut size={18} aria-hidden="true" />
            Sair
          </button>
        </header>

        <nav className="admin-nav" aria-label="Administração">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </main>
  );
}
