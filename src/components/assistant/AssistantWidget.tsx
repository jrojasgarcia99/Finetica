"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Avatar } from "@/components/ui/Avatar";
import { useT } from "@/components/i18n/I18nProvider";

const AVATAR = "/lia.svg";

// El SDK de IA + react-markdown pesan bastante y antes se importaban acá
// arriba (en un componente montado siempre en el layout raíz), así que ese
// peso se pagaba en CADA carga de página aunque nunca abrieras el chat. Con
// next/dynamic ese código recién se descarga/parsea la primera vez que se
// abre — el botón flotante en sí no necesita nada de eso.
const AssistantChat = dynamic(() => import("./AssistantChat").then((m) => m.AssistantChat), {
  ssr: false,
});

export function AssistantWidget({ enabled }: { enabled: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  // Una vez que se abrió la primera vez, el chat se queda montado (solo
  // oculto) para que la instancia de Chat sobreviva a cerrar/abrir el panel.
  const [everOpened, setEverOpened] = useState(false);

  if (!enabled) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setEverOpened(true);
            setOpen(true);
          }}
          aria-label={t("assistant.open")}
          className="fixed right-4 z-40 h-14 w-14 overflow-hidden rounded-full shadow-[var(--shadow-card)] ring-1 ring-border transition-transform hover:scale-105 active:scale-95 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 md:right-6"
        >
          <Avatar src={AVATAR} name="Lía" size={56} />
        </button>
      )}
      {everOpened && (
        <div className={open ? "" : "hidden"}>
          <AssistantChat open={open} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
