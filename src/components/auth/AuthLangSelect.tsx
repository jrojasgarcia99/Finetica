"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";

/** Selector de idioma para login/registro: cambia la pantalla al instante
 *  (setea la cookie y refresca) y además viaja en el formulario. */
export function AuthLangSelect({ current }: { current: "es" | "en" }) {
  const router = useRouter();
  return (
    <Select
      name="lang"
      defaultValue={current}
      onChange={(e) => {
        const v = e.target.value === "en" ? "en" : "es";
        document.cookie = `finefica_lang=${v}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
    >
      <option value="es">Español</option>
      <option value="en">English</option>
    </Select>
  );
}
