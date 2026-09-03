"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { MOBILE_NAV_COUNT, NAV_ITEMS, resolveNavItems, type NavItem } from "./nav-items";
import { logout } from "@/app/(app)/actions";
import { ExchangeRateWidget } from "./ExchangeRateWidget";
import { ThemeToggle } from "./ThemeToggle";
import { useT } from "@/components/i18n/I18nProvider";
import type { CurrencyConfig } from "@/lib/currency";
import type { Moneda } from "@/lib/types";

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="flex-1 space-y-1">
      {items.map((item) => {
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
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  householdName,
  memberName,
  currency,
  updateTipoCambio,
  navOrder,
  children,
}: {
  householdName: string;
  memberName: string;
  currency: CurrencyConfig;
  updateTipoCambio: (formData: FormData) => void | Promise<void>;
  navOrder?: string[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();
  const navItems: NavItem[] = navOrder ? resolveNavItems(navOrder) : NAV_ITEMS;
  const mobileItems = navItems.slice(0, MOBILE_NAV_COUNT);
  const secundaria: Moneda | null =
    currency.activas.find((m) => m !== currency.primaria) ?? null;

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Controles fijos, esquina superior derecha (escritorio):
          tipo de cambio + modo oscuro */}
      <div className="hidden md:flex items-center gap-2 fixed top-3 right-4 z-50">
        <ExchangeRateWidget
          primaria={currency.primaria}
          secundaria={secundaria}
          tipoCambio={currency.tipoCambio}
          updateAction={updateTipoCambio}
        />
        <ThemeToggle />
      </div>

      {/* Sidebar — escritorio */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-navy px-4 pt-6 pb-20">
        <div className="mb-8 px-2">
          <p className="text-gold-light text-[10px] tracking-[0.3em] uppercase">Finéfica</p>
          <p className="text-white font-semibold text-lg leading-tight">{householdName}</p>
        </div>
        <NavLinks items={navItems} />
        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-white/50 text-xs px-3">{t("shell.session", { name: memberName })}</p>
        </div>
      </aside>

      {/* Topbar — móvil */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 pt-[env(safe-area-inset-top)] box-content bg-navy flex items-center justify-between gap-2 px-4">
        <div className="min-w-0">
          <p className="text-gold-light text-[9px] tracking-[0.25em] uppercase leading-none">
            Finéfica
          </p>
          <p className="text-white font-semibold text-sm leading-tight truncate">{householdName}</p>
        </div>
        <div className="flex items-center gap-1">
          <ExchangeRateWidget
            primaria={currency.primaria}
            secundaria={secundaria}
            tipoCambio={currency.tipoCambio}
            updateAction={updateTipoCambio}
            tone="dark"
          />
          <ThemeToggle tone="dark" />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={t("shell.openMenu")}
            className="text-white p-2"
          >
            <Menu size={22} />
          </button>
        </div>
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
              <button onClick={() => setDrawerOpen(false)} className="text-white p-1" aria-label={t("shell.closeMenu")}>
                <X size={22} />
              </button>
            </div>
            <NavLinks items={navItems} onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-white/50 text-xs px-3">{t("shell.session", { name: memberName })}</p>
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Contenido */}
      <main className="flex-1 min-w-0 pt-[calc(3.5rem_+_env(safe-area-inset-top))] pb-[calc(4rem_+_env(safe-area-inset-bottom))] md:pt-0 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>

      {/* Cerrar sesión — siempre visible, esquina inferior izquierda */}
      <form
        action={logout}
        className="fixed left-3 bottom-[calc(4.75rem_+_env(safe-area-inset-bottom))] z-50 md:left-4 md:bottom-4"
      >
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-medium text-navy shadow-lg hover:bg-gray-50"
        >
          <LogOut size={15} strokeWidth={1.75} />
          {t("shell.logout")}
        </button>
      </form>

      {/* Barra inferior — móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 pb-[env(safe-area-inset-bottom)] box-content bg-white border-t border-border flex items-stretch">
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
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
