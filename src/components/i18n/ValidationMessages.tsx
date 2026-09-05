"use client";

import { useEffect } from "react";
import { useT } from "@/components/i18n/I18nProvider";

/** El mensaje nativo del navegador para un campo `required` vacío ("Please
 *  fill out this field") no respeta el idioma de la página — solo el del
 *  navegador. Este componente lo reemplaza por el texto correcto, para
 *  cualquier campo requerido de toda la app, sin tener que tocar cada
 *  formulario uno por uno.
 *
 *  Un campo puede seguir definiendo su propio onInvalid más específico (p.ej.
 *  TermsCheckbox) — como ese listener vive directo en el elemento, corre
 *  después de este (que escucha en fase de captura, antes de llegar al
 *  elemento) y gana, sobreescribiendo el mensaje genérico. */
export function ValidationMessages() {
  const t = useT();

  useEffect(() => {
    const onInvalid = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (!el || !("validity" in el)) return;
      if (el.validity.valueMissing) {
        el.setCustomValidity(t("form.required"));
      }
    };
    const clear = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      el?.setCustomValidity?.("");
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", clear, true);
    document.addEventListener("change", clear, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", clear, true);
      document.removeEventListener("change", clear, true);
    };
  }, [t]);

  return null;
}
