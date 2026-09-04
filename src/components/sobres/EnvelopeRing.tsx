"use client";

import { useEffect, useRef } from "react";
import { SEMAFORO_COLOR, type Semaforo } from "@/lib/types";
import { EnvelopeIcon } from "./envelope-icons";

const R = 34; // radio
const C = 2 * Math.PI * R; // circunferencia

/**
 * Anillo de progreso (SVG) alrededor del ícono del sobre. El % es "gastado /
 * presupuesto" (mismo `pct` que calcula `resumenSobre`); si el sobre está
 * sobregirado el anillo se topa en 100% y va en rojo. El color normal sale del
 * semáforo existente (`SEMAFORO_COLOR`). El llenado se anima al montar
 * (transición CSS del `stroke-dashoffset`, sin librería).
 */
export function EnvelopeRing({
  icono,
  pct,
  semaforo,
  overdrawn,
  ilimitado = false,
  size = 76,
  iconSize = 22,
}: {
  icono: string;
  pct: number;
  semaforo: Semaforo;
  overdrawn: boolean;
  /** Meta ilimitada: anillo completo en el azul de marca, sin semáforo. */
  ilimitado?: boolean;
  size?: number;
  iconSize?: number;
}) {
  const fill = ilimitado || overdrawn ? 1 : Math.max(0, Math.min(1, pct));
  const color = ilimitado
    ? "var(--navy)"
    : overdrawn
      ? SEMAFORO_COLOR.rojo
      : SEMAFORO_COLOR[semaforo];
  const target = C * (1 - fill);

  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      el.style.transition = "none";
      el.style.strokeDashoffset = String(target);
      return;
    }

    // Arranca vacío y en el siguiente frame anima hasta el valor real.
    el.style.strokeDashoffset = String(C);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (circleRef.current) {
          circleRef.current.style.strokeDashoffset = String(target);
        }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <circle
          cx="40"
          cy="40"
          r={R}
          fill="none"
          stroke="var(--border)"
          strokeWidth="5"
        />
        <circle
          ref={circleRef}
          cx="40"
          cy="40"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          transform="rotate(-90 40 40)"
          style={{
            transition: "stroke-dashoffset 720ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <span
        className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white"
        style={{ width: size * 0.64, height: size * 0.64, color }}
      >
        <EnvelopeIcon name={icono} size={iconSize} />
      </span>
    </div>
  );
}
