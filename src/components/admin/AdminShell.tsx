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

function AdminNav({ pathname, compact = false }: { pathname: string; compact?: boolean }) {
  return (
    <nav className={compact ? "admin-bottom-nav" : "admin-nav"} aria-label="Administração">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="admin-app-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Brand />
          <span>Admin</span>
        </div>

        <AdminNav pathname={pathname} />

        <button type="button" className="secondary-button admin-logout" onClick={logoutAdminUser}>
          <LogOut size={18} aria-hidden="true" />
          Sair
        </button>
      </aside>

      <section className="admin-main-shell">
        <header className="admin-mobile-topbar">
          <div>
            <Brand />
            <span>Admin</span>
          </div>
          <button type="button" className="secondary-button admin-mobile-logout" onClick={logoutAdminUser}>
            <LogOut size={18} aria-hidden="true" />
            Sair
          </button>
        </header>

        <div className="admin-content-shell">{children}</div>

        <AdminNav pathname={pathname} compact />
      </section>
    </main>
  );
}
