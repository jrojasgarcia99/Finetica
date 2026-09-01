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
