"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { useT } from "@/components/i18n/I18nProvider";
import { getBiometricLockEnabled, setBiometricLockEnabled } from "@/lib/native/biometricLock";

/**
 * Solo existe dentro de la app nativa (Android/iOS) — en el navegador no
 * se muestra nada, porque no hay huella/Face ID de la que hablar. La
 * preferencia es local a este teléfono, no de la cuenta (ver biometricLock.ts).
 */
export function BiometricLockCard() {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const p = Capacitor.getPlatform();
    if (p !== "android" && p !== "ios") return;
    void (async () => {
      const { NativeBiometric } = await import("@capgo/capacitor-native-biometric");
      const [avail, currentlyEnabled] = await Promise.all([
        NativeBiometric.isAvailable({ useFallback: true }),
        getBiometricLockEnabled(),
      ]);
      if (!avail.isAvailable) return;
      setPlatform(p);
      setEnabled(currentlyEnabled);
      setReady(true);
    })();
  }, []);

  if (!ready || !platform) return null;

  function toggle(checked: boolean) {
    setEnabled(checked);
    void setBiometricLockEnabled(checked);
  }

  const label = platform === "ios" ? t("config.bioIOS") : t("config.bioAndroid");
  const desc =
    platform === "ios" ? t("config.appLockDescIOS") : t("config.appLockDescAndroid");

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("config.appLock")}</CardTitle>
      </CardHeader>
      <CardBody>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 has-[:checked]:border-navy">
          <span>
            <span className="block text-sm font-medium text-gray-700">{label}</span>
            <span className="block text-xs text-gray-400">{desc}</span>
          </span>
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => toggle(e.target.checked)}
              className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-full bg-gray-200 transition-colors peer-checked:bg-navy" />
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </CardBody>
    </Card>
  );
}
