import {
  Fuel,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  HeartPulse,
  Gift,
  Plane,
  Smartphone,
  GraduationCap,
  PawPrint,
  Wrench,
  Tv,
  Droplet,
  Zap,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ENVELOPE_ICON_NAMES, type EnvelopeIconName } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

/** Galería fija de íconos para los sobres. Ampliá agregando aquí + en ENVELOPE_ICON_NAMES. */
export const ENVELOPE_ICONS: Record<EnvelopeIconName, LucideIcon> = {
  Fuel,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  HeartPulse,
  Gift,
  Plane,
  Smartphone,
  GraduationCap,
  PawPrint,
  Wrench,
  Tv,
  Droplet,
  Zap,
  Wallet,
};

export { ENVELOPE_ICON_NAMES };

/** Íconos agrupados por categoría, para el selector de ícono. */
export const ENVELOPE_ICON_GROUPS: {
  key: string;
  labelKey: TKey;
  icons: EnvelopeIconName[];
}[] = [
  { key: "hogar", labelKey: "sobres.iconGroupHome", icons: ["Home", "Wrench", "Droplet", "Zap", "Tv"] },
  { key: "transporte", labelKey: "sobres.iconGroupTransport", icons: ["Car", "Fuel"] },
  { key: "comida", labelKey: "sobres.iconGroupFood", icons: ["Utensils", "ShoppingCart"] },
  { key: "salud", labelKey: "sobres.iconGroupHealth", icons: ["HeartPulse"] },
  { key: "ocio", labelKey: "sobres.iconGroupLeisure", icons: ["Plane", "Gift"] },
  { key: "tecnologia", labelKey: "sobres.iconGroupTech", icons: ["Smartphone"] },
  { key: "educacion", labelKey: "sobres.iconGroupEducation", icons: ["GraduationCap"] },
  { key: "mascotas", labelKey: "sobres.iconGroupPets", icons: ["PawPrint"] },
  { key: "otro", labelKey: "sobres.iconGroupOther", icons: ["Wallet"] },
];

/** Ícono de un sobre por nombre; Wallet como respaldo si el nombre no está en la galería. */
export function EnvelopeIcon({
  name,
  size = 20,
  strokeWidth = 1.75,
  className,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Icon = ENVELOPE_ICONS[name as EnvelopeIconName] ?? Wallet;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}
