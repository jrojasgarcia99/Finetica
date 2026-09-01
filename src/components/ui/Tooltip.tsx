"use client";

import { HelpCircle } from "lucide-react";

/**
 * Tooltip de la app (solo CSS, sin librería). Muestra `content` al pasar el
 * cursor o al enfocar un hijo interactivo. Estilo consistente en toda la app.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className = "",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}) {
  return (
    <span className={`group/tt relative inline-flex items-center ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-[15rem] -translate-x-1/2 rounded-md bg-navy px-2.5 py-1.5 text-center text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 ${
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        }`}
      >
        {content}
      </span>
    </span>
  );
}

/** Ícono de ayuda con tooltip, para poner junto a una etiqueta. */
export function InfoHint({
  content,
  side = "top",
  label = "Info",
}: {
  content: React.ReactNode;
  side?: "top" | "bottom";
  label?: string;
}) {
  return (
    <Tooltip content={content} side={side}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex text-gray-400 transition-colors hover:text-gray-500"
        onClick={(e) => e.preventDefault()}
      >
        <HelpCircle size={13} />
      </button>
    </Tooltip>
  );
}
