"use client";

import { useEffect } from "react";

/**
 * Bloquea el pinch-zoom y el double-tap-zoom a nivel de gesto. La meta
 * `maximum-scale=1, user-scalable=no` no basta: iOS Safari la ignora fuera de
 * modo standalone (y a veces incluso ahí), y un usuario que logra hacer zoom
 * deja la barra inferior fija "flotando" (queda anclada al viewport de
 * layout, no al visual, así que parece despegarse al scrollear).
 */
export function NoZoom() {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    const stopMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    let lastTouchEnd = 0;
    const stopDoubleTap = (e: TouchEvent) => {
      const now = e.timeStamp;
      if (now - lastTouchEnd <= 350) e.preventDefault();
      lastTouchEnd = now;
    };

    // Gestos de pellizco (Safari expone gesturestart/-change fuera del
    // estándar; el resto de navegadores solo dispara touchmove multitáctil).
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    document.addEventListener("touchmove", stopMultiTouch, { passive: false });
    document.addEventListener("touchend", stopDoubleTap, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("touchmove", stopMultiTouch);
      document.removeEventListener("touchend", stopDoubleTap);
    };
  }, []);

  return null;
}
