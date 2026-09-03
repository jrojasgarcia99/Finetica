"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { useT } from "@/components/i18n/I18nProvider";
import {
  TEMAS,
  TEMA_SWATCH,
  TEMA_LABEL_KEY,
  PALETTE_COOKIE,
  type Tema,
} from "@/lib/theme";

function applyPalette(tema: Tema) {
  document.documentElement.dataset.palette = tema;
  try {
    document.cookie = `${PALETTE_COOKIE}=${tema}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; samesite=lax`;
  } catch {
    /* cookies no disponibles */
  }
}

function Swatch({ tema }: { tema: Tema }) {
  const s = TEMA_SWATCH[tema];
  const half = (v: typeof s.light) => (
    <div className="flex flex-1 items-center gap-1.5 px-2" style={{ background: v.bg }}>
      <span
        className="h-5 w-4 rounded-[3px] border"
        style={{ background: v.card, borderColor: "rgba(0,0,0,0.12)" }}
      />
      <span className="h-3 w-3 rounded-full" style={{ background: v.primary }} />
      <span className="h-3 w-3 rounded-full" style={{ background: v.accent }} />
    </div>
  );
  return (
    <div className="flex h-11 w-full overflow-hidden rounded-lg border border-border">
      {half(s.light)}
      {half(s.dark)}
    </div>
  );
}

export function AppearanceCard({
  current,
  action,
}: {
  current: Tema;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = useT();
  const [selected, setSelected] = useState<Tema>(current);
  const [pending, startTransition] = useTransition();

  function choose(tema: Tema) {
    if (tema === selected && !pending) {
      applyPalette(tema);
      return;
    }
    setSelected(tema);
    applyPalette(tema);
    const fd = new FormData();
    fd.set("tema", tema);
    startTransition(() => action(fd));
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("config.appearance")}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="mb-4 text-xs text-gray-500">{t("config.appearanceDesc")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMAS.map((tema) => {
            const active = selected === tema;
            return (
              <button
                key={tema}
                type="button"
                onClick={() => choose(tema)}
                aria-pressed={active}
                className={`group flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-colors ${
                  active
                    ? "border-navy-light ring-2 ring-navy-light/40"
                    : "border-border hover:border-navy-light/50"
                }`}
              >
                <Swatch tema={tema} />
                <span className="flex items-center justify-between px-0.5 text-sm font-medium text-navy">
                  {t(TEMA_LABEL_KEY[tema])}
                  {active && <Check size={15} className="text-navy-light" />}
                </span>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
