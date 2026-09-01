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
  type LucideIcon,
} from "lucide-react";
import type { TKey } from "@/lib/i18n";

export type NavItem = {
  href: string;
  labelKey: TKey;
  icon: LucideIcon;
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/presupuesto", labelKey: "nav.presupuesto", icon: Wallet, mobile: true },
  { href: "/sobres", labelKey: "nav.sobres", icon: Mail, mobile: true },
  { href: "/patrimonio", labelKey: "nav.patrimonio", icon: Landmark, mobile: false },
  { href: "/deudas", labelKey: "nav.deudas", icon: Snowflake, mobile: true },
  { href: "/fondo-emergencia", labelKey: "nav.fondo", icon: ShieldCheck, mobile: false },
  { href: "/familiar", labelKey: "nav.familiar", icon: UsersRound, mobile: false },
  { href: "/historial", labelKey: "nav.historial", icon: History, mobile: false },
  { href: "/config", labelKey: "nav.config", icon: Settings, mobile: true },
];
