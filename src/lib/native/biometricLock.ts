import { Preferences } from "@capacitor/preferences";

/**
 * Preferencia LOCAL del dispositivo (no viaja a la cuenta/servidor): cada
 * teléfono tiene su propia huella/Face ID enrolada, así que esto no puede ser
 * una config de la cuenta compartida entre dispositivos. Por defecto
 * encendido — si el teléfono ya tiene biometría, se aprovecha.
 */
const KEY = "finefica_biometric_lock_enabled";

export async function getBiometricLockEnabled(): Promise<boolean> {
  const { value } = await Preferences.get({ key: KEY });
  return value !== "false";
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  await Preferences.set({ key: KEY, value: String(enabled) });
}
