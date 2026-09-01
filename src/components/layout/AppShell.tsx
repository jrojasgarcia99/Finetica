"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { logout } from "@/app/(app)/actions";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  householdName,
  memberName,
  children,
}: {
  householdName: string;
  memberName: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const mobileItems = NAV_ITEMS.filter((i) => i.mobile);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — escritorio */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-navy px-4 py-6">
        <div className="mb-8 px-2">
          <p className="text-gold-light text-[10px] tracking-[0.3em] uppercase">Finéfica</p>
          <p className="text-white font-semibold text-lg leading-tight">{householdName}</p>
        </div>
        <NavLinks />
        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-white/50 text-xs px-3 mb-2">Sesión de {memberName}</p>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white w-full"
            >
              <LogOut size={18} strokeWidth={1.75} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Topbar — móvil */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-navy flex items-center justify-between px-4">
        <div>
          <p className="text-gold-light text-[9px] tracking-[0.25em] uppercase leading-none">
            Finéfica
          </p>
          <p className="text-white font-semibold text-sm leading-tight">{householdName}</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
          className="text-white p-2"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Drawer — móvil */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-72 bg-navy px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <p className="text-gold-light text-[10px] tracking-[0.3em] uppercase">Finéfica</p>
                <p className="text-white font-semibold text-lg leading-tight">{householdName}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-white p-1" aria-label="Cerrar menú">
                <X size={22} />
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-white/50 text-xs px-3 mb-2">Sesión de {memberName}</p>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 w-full"
                >
                  <LogOut size={18} strokeWidth={1.75} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Contenido */}
      <main className="flex-1 min-w-0 pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>

      {/* Barra inferior — móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-white border-t border-border flex items-stretch">
        {mobileItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                active ? "text-navy" : "text-gray-400"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
