import {
  LayoutDashboard,
  Wallet,
  Landmark,
  Snowflake,
  ShieldCheck,
  History,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard, mobile: true },
  { href: "/presupuesto", label: "Presupuesto", icon: Wallet, mobile: true },
  { href: "/patrimonio", label: "Patrimonio", icon: Landmark, mobile: true },
  { href: "/deudas", label: "Deudas", icon: Snowflake, mobile: true },
  { href: "/fondo-emergencia", label: "Fondo", icon: ShieldCheck, mobile: false },
  { href: "/historial", label: "Historial", icon: History, mobile: false },
  { href: "/hogar", label: "Hogar", icon: Users, mobile: false },
  { href: "/config", label: "Configuración", icon: Settings, mobile: true },
];
