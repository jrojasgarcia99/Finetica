"use client";

import Link from "next/link";

/** Checkbox obligatorio del onboarding. El mensaje nativo del navegador para
 *  un checkbox `required` no vacío ("Please check this box...") no respeta el
 *  idioma de la página — solo el idioma del navegador. Lo reemplazamos por el
 *  texto correcto vía setCustomValidity(), recibido ya traducido del server. */
export function TermsCheckbox({
  acceptText,
  andText,
  privacyLabel,
  termsLabel,
  errorMessage,
}: {
  acceptText: string;
  andText: string;
  privacyLabel: string;
  termsLabel: string;
  errorMessage: string;
}) {
  return (
    <label className="flex items-start gap-2 text-xs text-gray-500">
      <input
        type="checkbox"
        name="acepta_terminos"
        required
        className="mt-0.5 h-5 w-5 shrink-0 accent-navy"
        onInvalid={(e) => e.currentTarget.setCustomValidity(errorMessage)}
        onChange={(e) => e.currentTarget.setCustomValidity("")}
      />
      <span>
        {acceptText}{" "}
        <Link href="/privacidad" target="_blank" className="text-navy-light hover:underline">
          {privacyLabel}
        </Link>{" "}
        {andText}{" "}
        <Link href="/terminos" target="_blank" className="text-navy-light hover:underline">
          {termsLabel}
        </Link>
        .
      </span>
    </label>
  );
}
