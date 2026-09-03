import {
  LayoutDashboard,
  Wallet,
  Mail,
  Landmark,
  Snowflake,
  ShieldCheck,
  History,
  UsersRound,
  Settings,
  CircleUser,
  type LucideIcon,
} from "lucide-react";
import type { TKey } from "@/lib/i18n";

export type NavItem = {
  href: string;
  labelKey: TKey;
  icon: LucideIcon;
};

/** Lista maestra + orden por defecto. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/presupuesto", labelKey: "nav.presupuesto", icon: Wallet },
  { href: "/sobres", labelKey: "nav.sobres", icon: Mail },
  { href: "/patrimonio", labelKey: "nav.patrimonio", icon: Landmark },
  { href: "/deudas", labelKey: "nav.deudas", icon: Snowflake },
  { href: "/fondo-emergencia", labelKey: "nav.fondo", icon: ShieldCheck },
  { href: "/familiar", labelKey: "nav.familiar", icon: UsersRound },
  { href: "/historial", labelKey: "nav.historial", icon: History },
  { href: "/config", labelKey: "nav.config", icon: Settings },
  { href: "/perfil", labelKey: "nav.perfil", icon: CircleUser },
];

export const NAV_HREFS = NAV_ITEMS.map((i) => i.href);

/** Cuántos entran en la barra inferior del teléfono. */
export const MOBILE_NAV_COUNT = 5;

/**
 * Aplica el orden guardado por el usuario (arreglo de rutas). Ignora rutas
 * desconocidas y agrega al final las que el usuario no haya ordenado, para que
 * nuevas pantallas sigan apareciendo.
 */
export function resolveNavItems(stored: string[] | null | undefined): NavItem[] {
  if (!stored || !Array.isArray(stored) || stored.length === 0) return NAV_ITEMS;
  const byHref = new Map(NAV_ITEMS.map((i) => [i.href, i]));
  const seen = new Set<string>();
  const ordered: NavItem[] = [];
  for (const href of stored) {
    const it = byHref.get(href);
    if (it && !seen.has(href)) {
      ordered.push(it);
      seen.add(href);
    }
  }
  for (const it of NAV_ITEMS) if (!seen.has(it.href)) ordered.push(it);
  return ordered;
}
