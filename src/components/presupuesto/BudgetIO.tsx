"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Check,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/I18nProvider";
import {
  previewBudgetImport,
  commitBudgetImport,
  type ImportPreview,
} from "@/app/(app)/presupuesto/xlsx-actions";

type Scope = "personal" | "family";

const PILL =
  "inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

export function BudgetIO({
  scope,
  mes,
  anio,
}: {
  scope: Scope;
  mes: number;
  anio: number;
}) {
  const t = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [reading, startReading] = useTransition();
  const [committing, setCommitting] = useState(false);
  const [flash, setFlash] = useState<{ tone: "ok" | "bad"; text: string } | null>(
    null,
  );

  const base = `/api/budget-xlsx?scope=${scope}`;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFlash(null);
    const fd = new FormData();
    fd.set("scope", scope);
    fd.set("mes", String(mes));
    fd.set("anio", String(anio));
    fd.set("file", file);
    startReading(async () => {
      const res = await previewBudgetImport(fd);
      setPreview(res);
      if (!res.ok && res.error) setFlash({ tone: "bad", text: res.error });
    });
  }

  async function confirmImport() {
    if (!preview) return;
    const rows = preview.rows
      .filter((r) => r.ok)
      .map((r) => ({
        categoria: r.categoria,
        concepto: r.concepto,
        monto: r.monto,
        moneda: r.moneda,
        recurrente: r.recurrente,
      }));
    if (rows.length === 0) return;

    setCommitting(true);
    const res = await commitBudgetImport({ scope, mes, anio, rows });
    setCommitting(false);
    setPreview(null);

    if (res.ok) {
      setFlash({ tone: "ok", text: t("xlsx.importDone", { n: res.inserted }) });
      router.refresh();
    } else {
      setFlash({ tone: "bad", text: t("xlsx.importFailed") });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`${base}&mode=template`} className={PILL}>
        <Download size={15} />
        {t("xlsx.downloadTemplate")}
      </a>

      <a href={`${base}&mode=export&mes=${mes}&anio=${anio}`} className={PILL}>
        <FileSpreadsheet size={15} />
        {t("xlsx.exportMonth")}
      </a>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={reading}
        className={PILL}
      >
        <Upload size={15} />
        {reading ? t("xlsx.reading") : t("xlsx.importExcel")}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={pick}
      />

      {flash && (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            flash.tone === "ok" ? "text-green" : "text-red"
          }`}
        >
          {flash.tone === "ok" ? <Check size={13} /> : <TriangleAlert size={13} />}
          {flash.text}
        </span>
      )}

      {preview?.ok && (
        <ImportPreviewModal
          preview={preview}
          committing={committing}
          onCancel={() => setPreview(null)}
          onConfirm={confirmImport}
        />
      )}
    </div>
  );
}

function ImportPreviewModal({
  preview,
  committing,
  onCancel,
  onConfirm,
}: {
  preview: ImportPreview;
  committing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[var(--radius-card)] bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-sm font-semibold text-navy">
              {t("xlsx.previewTitle")}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {t("xlsx.previewSummary", {
                total: preview.total,
                ok: preview.validos,
                bad: preview.invalidos,
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-300 hover:text-navy"
            aria-label={t("common.cancel")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {preview.total === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {t("xlsx.previewEmpty")}
            </p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="w-8 pb-2 font-medium">#</th>
                  <th className="pb-2 pr-2 font-medium">{t("xlsx.colCategoria")}</th>
                  <th className="pb-2 pr-2 font-medium">{t("xlsx.colConcepto")}</th>
                  <th className="pb-2 pr-2 text-right font-medium">
                    {t("xlsx.colMonto")}
                  </th>
                  <th className="pb-2 pr-2 font-medium">{t("xlsx.colMoneda")}</th>
                  <th className="pb-2 font-medium">{t("xlsx.colRecurrente")}</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr
                    key={r.fila}
                    className={`border-t border-border align-top ${
                      r.ok ? "" : "bg-red/5"
                    }`}
                  >
                    <td className="py-1.5 text-gray-400">{r.fila}</td>
                    <td className="py-1.5 pr-2">
                      {r.categoria || <span className="text-gray-300">—</span>}
                      {!r.ok && r.errores.length > 0 && (
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-red">
                          <TriangleAlert size={11} />
                          {r.errores.join(" · ")}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2">
                      {r.concepto || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">
                      {r.montoTexto || "—"}
                    </td>
                    <td className="py-1.5 pr-2">{r.moneda}</td>
                    <td className="py-1.5">
                      {r.recurrente ? t("xlsx.yes") : t("xlsx.no")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <p className="text-xs text-gray-500">
            {t("xlsx.previewAddNote", { ok: preview.validos })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={committing}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={committing || preview.validos === 0}
            >
              {committing
                ? t("xlsx.importing")
                : t("xlsx.confirmImport", { ok: preview.validos })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
