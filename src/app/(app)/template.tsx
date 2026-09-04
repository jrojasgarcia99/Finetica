"use client";

import { useEffect, useState } from "react";

/**
 * `template.tsx` se re-monta en cada navegación dentro de `(app)`, así que la
 * animación de entrada corre en cada cambio de página. Si la navegación vino de
 * un swipe, `nav-dir` en sessionStorage indica la dirección para que la nueva
 * página entre deslizándose desde el lado correcto.
 */
function readNavDir(): "" | "left" | "right" {
  if (typeof window === "undefined") return "";
  try {
    const d = window.sessionStorage.getItem("nav-dir");
    return d === "left" || d === "right" ? d : "";
  } catch {
    return "";
  }
}

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const [dir] = useState(readNavDir);

  useEffect(() => {
    try {
      window.sessionStorage.removeItem("nav-dir");
    } catch {
      /* sin sessionStorage */
    }
  }, []);

  const cls =
    dir === "left"
      ? "animate-page-in-left"
      : dir === "right"
        ? "animate-page-in-right"
        : "animate-page-in";
  return <div className={`${cls} motion-reduce:animate-none`}>{children}</div>;
}
