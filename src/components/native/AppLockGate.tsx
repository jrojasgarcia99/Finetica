"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Fingerprint } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { useT } from "@/components/i18n/I18nProvider";
import { getBiometricLockEnabled } from "@/lib/native/biometricLock";

/**
 * Pantalla de bloqueo con Face ID / huella, solo dentro de la app nativa
 * (Capacitor) — en el navegador normal esto no hace nada.
 *
 * IMPORTANTE sobre qué protege esto y qué no: Finéticap no empaqueta el sitio
 * adentro del binario (ver capacitor.config.ts) — la app nativa carga la
 * página real del servidor, con tu sesión. Esta pantalla es una cortina
 * visual que tapa el contenido hasta verificar tu identidad (igual que el
 * "app lock" de apps bancarias comunes); NO es lo que evita que alguien vea
 * tus datos — eso lo sigue haciendo la sesión de Supabase (cookies + RLS) tal
 * cual ya funcionaba. Si el teléfono no tiene ninguna huella/Face ID/PIN
 * configurado, no se puede exigir nada — se deja pasar sin bloquear.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const t = useT();
  const isNative = Capacitor.isNativePlatform();
  // Arranca "bloqueado" en nativo para que no destelle contenido antes de
  // decidir (el chequeo real es asíncrono). En navegador, nunca se bloquea.
  const [locked, setLocked] = useState(isNative);
  const [checking, setChecking] = useState(isNative);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Núcleo de la verificación. A propósito no llama a setState de forma
  // síncrona (todo pasa después del primer await) para poder dispararse
  // desde un efecto sin activar cascading-renders.
  async function runCheck() {
    try {
      const enabled = await getBiometricLockEnabled();
      if (!enabled) {
        // Lo desactivaron en Configuración: no hay nada que pedir.
        setLocked(false);
        return;
      }
      const { NativeBiometric } = await import("@capgo/capacitor-native-biometric");
      const avail = await NativeBiometric.isAvailable({ useFallback: true });
      if (!avail.isAvailable) {
        // El dispositivo no tiene huella/Face ID/PIN configurado: no hay nada
        // que exigir, se deja pasar.
        setLocked(false);
        return;
      }
      await NativeBiometric.verifyIdentity({
        reason: t("lock.reason"),
        title: t("lock.title"),
        subtitle: t("lock.subtitle"),
        useFallback: true,
      });
      setLocked(false);
    } catch (err) {
      const { BiometricAuthError } = await import("@capgo/capacitor-native-biometric");
      const code = (err as { code?: number })?.code;
      if (
        code === BiometricAuthError.USER_CANCEL ||
        code === BiometricAuthError.SYSTEM_CANCEL ||
        code === BiometricAuthError.APP_CANCEL
      ) {
        setErrorKey("lock.errCanceled");
      } else if (
        code === BiometricAuthError.USER_LOCKOUT ||
        code === BiometricAuthError.USER_TEMPORARY_LOCKOUT
      ) {
        setErrorKey("lock.errLockout");
      } else {
        setErrorKey("lock.errFailed");
      }
    } finally {
      setChecking(false);
    }
  }

  // Botón "reintentar": evento de usuario disparado por el humano, no un
  // efecto — acá sí es normal marcar "verificando" de inmediato.
  function retry() {
    setChecking(true);
    setErrorKey(null);
    void runCheck();
  }

  useEffect(() => {
    if (!isNative) return;
    // El patrón de "buscar al montar" que recomienda la propia guía de React
    // (linkeada en el mensaje de esta regla): la regla no distingue esto de
    // un cascading-render real porque no rastrea que todo pasa detrás de un
    // await, así que se desactiva a propósito acá.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vuelve a bloquear cuando la app pasa a segundo plano.
  useEffect(() => {
    if (!isNative) return;
    let handle: { remove: () => void } | undefined;
    let cancelled = false;
    void import("@capacitor/app").then(({ App }) => {
      if (cancelled) return;
      void App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) return;
        void getBiometricLockEnabled().then((enabled) => {
          if (enabled) setLocked(true);
        });
      }).then((h) => {
        if (cancelled) h.remove();
        else handle = h;
      });
    });
    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, [isNative]);

  return (
    <>
      <div aria-hidden={locked} className={locked ? "invisible" : ""}>
        {children}
      </div>
      {locked && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-navy px-8 text-center">
          <BrandMark size={40} />
          <div>
            <p className="text-lg font-semibold text-white">{t("lock.title")}</p>
            <p className="mt-1 text-sm text-white/60">{t("lock.subtitle")}</p>
          </div>
          {errorKey && <p className="text-sm text-red-300">{t(errorKey)}</p>}
          <button
            type="button"
            onClick={retry}
            disabled={checking}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-navy disabled:opacity-60"
          >
            <Fingerprint size={18} />
            {checking ? "…" : errorKey ? t("lock.retry") : t("lock.unlock")}
          </button>
        </div>
      )}
    </>
  );
}
