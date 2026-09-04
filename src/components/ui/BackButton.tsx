import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Botón de "volver": solo la flecha, circular, con material de vidrio
 * esmerilado (blur + capa translúcida sobre `--card`) para que se sienta
 * parte de la interfaz del teléfono en vez de un link de texto suelto. No es
 * el "Liquid Glass" nativo de iOS (eso es privado del sistema, no hay API web
 * para pedirlo), pero `backdrop-filter` da un resultado muy cercano y sí
 * funciona en cualquier navegador/PWA.
 */
export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="mb-4 inline-grid h-10 w-10 place-items-center rounded-full border border-border/70 text-navy shadow-sm backdrop-blur-xl backdrop-saturate-150"
      style={{ backgroundColor: "color-mix(in oklab, var(--card) 72%, transparent)" }}
    >
      <ArrowLeft size={20} />
    </Link>
  );
}
