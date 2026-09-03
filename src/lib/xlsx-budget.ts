import ExcelJS from "exceljs";

/**
 * Generación y lectura de archivos `.xlsx` para importar / exportar líneas del
 * Presupuesto (personal y familiar). Sólo se usa desde el servidor (route
 * handler + server actions) — `exceljs` nunca llega al bundle del cliente.
 */

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const LIST_SHEET = "Listas";

export type ExportRow = {
  categoria: string;
  concepto: string;
  monto: number;
  moneda: string;
  recurrente: boolean;
};

export type WorkbookOpts = {
  /** Nombre de la hoja de datos (localizado: "Gastos" / "Expenses"). */
  sheetName: string;
  headers: {
    categoria: string;
    concepto: string;
    monto: string;
    moneda: string;
    recurrente: string;
  };
  /** Etiquetas para la columna Recurrente: [sí, no]. */
  siNo: [string, string];
  /** Valores válidos para la lista desplegable de Categoría. */
  categorias: string[];
  /** Códigos de moneda activos ("CRC", "USD"). */
  monedas: string[];
  /** Filas a precargar (vacío para la plantilla en blanco). */
  rows: ExportRow[];
};

/** Construye la plantilla / exportación con listas desplegables (validación de datos). */
export async function buildBudgetWorkbook(
  opts: WorkbookOpts,
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Finetica";
  wb.created = new Date();

  const ws = wb.addWorksheet(opts.sheetName);
  const listas = wb.addWorksheet(LIST_SHEET);
  listas.state = "hidden";

  const cats = opts.categorias.length ? opts.categorias : [""];
  const curs = opts.monedas.length ? opts.monedas : ["CRC"];
  cats.forEach((c, i) => {
    listas.getCell(i + 1, 1).value = c;
  });
  curs.forEach((c, i) => {
    listas.getCell(i + 1, 2).value = c;
  });
  listas.getCell(1, 3).value = opts.siNo[0];
  listas.getCell(2, 3).value = opts.siNo[1];

  ws.columns = [
    { header: opts.headers.categoria, key: "categoria", width: 26 },
    { header: opts.headers.concepto, key: "concepto", width: 34 },
    { header: opts.headers.monto, key: "monto", width: 14 },
    { header: opts.headers.moneda, key: "moneda", width: 10 },
    { header: opts.headers.recurrente, key: "recurrente", width: 16 },
  ];

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A5F" } };
  head.alignment = { vertical: "middle", horizontal: "left" };
  head.height = 20;

  for (const r of opts.rows) {
    ws.addRow({
      categoria: r.categoria,
      concepto: r.concepto,
      monto: r.monto,
      moneda: r.moneda,
      recurrente: r.recurrente ? opts.siNo[0] : opts.siNo[1],
    });
  }

  ws.getColumn("monto").numFmt = "#,##0.########";
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Validación de datos en un rango amplio (bastante más allá de los datos).
  const lastRow = Math.max(opts.rows.length + 1, 1) + 300;
  for (let r = 2; r <= lastRow; r++) {
    ws.getCell(r, 1).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`${LIST_SHEET}!$A$1:$A$${cats.length}`],
      showErrorMessage: true,
    };
    ws.getCell(r, 4).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`${LIST_SHEET}!$B$1:$B$${curs.length}`],
      showErrorMessage: true,
    };
    ws.getCell(r, 5).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`${LIST_SHEET}!$C$1:$C$2`],
      showErrorMessage: true,
    };
  }

  return (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}

// --- Lectura / validación de un archivo importado ----------------------

export type PreviewRow = {
  /** Número de fila en el Excel (para señalar errores). */
  fila: number;
  categoria: string;
  concepto: string;
  monto: number;
  montoTexto: string;
  moneda: string;
  recurrente: boolean;
  errores: string[];
  ok: boolean;
};

export type ParseLabels = {
  missingCategoria: string;
  badCategoria: string;
  missingConcepto: string;
  badMonto: string;
  badMoneda: string;
};

const SI_RE = /^(s[ií]|si|sí|yes|y|true|verdadero|1|x)$/i;

function normKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cellText(v: ExcelJS.CellValue | undefined): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (Array.isArray(o.richText)) {
      return o.richText.map((t) => (t as { text?: string }).text ?? "").join("");
    }
    if ("result" in o) return o.result == null ? "" : String(o.result);
    return "";
  }
  return String(v);
}

function parseMonto(v: ExcelJS.CellValue | undefined): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if (typeof o.result === "number") return o.result;
  }
  let s = cellText(v).replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    s =
      lastComma > lastDot
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const parts = s.split(",");
    s =
      parts.length === 2 && parts[parts.length - 1].length <= 2
        ? parts.join(".")
        : parts.join("");
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

export async function parseBudgetWorkbook(
  data: ArrayBuffer,
  opts: {
    categoriasValidas: string[];
    monedasValidas: string[];
    monedaPorDefecto: string;
    labels: ParseLabels;
  },
): Promise<PreviewRow[]> {
  const wb = new ExcelJS.Workbook();
  // exceljs acepta ArrayBuffer/Uint8Array en runtime; los tipos piden Buffer.
  await wb.xlsx.load(data as unknown as Parameters<typeof wb.xlsx.load>[0]);

  const ws =
    wb.worksheets.find((w) => (w.state ?? "visible") === "visible") ??
    wb.worksheets[0];
  if (!ws) return [];

  const catSet = new Set(opts.categoriasValidas.map(normKey));
  const curSet = new Set(opts.monedasValidas.map((m) => m.toUpperCase()));
  const out: PreviewRow[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // encabezado

    const categoria = cellText(row.getCell(1).value).trim();
    const concepto = cellText(row.getCell(2).value).trim();
    const montoValue = row.getCell(3).value;
    const monedaRaw = cellText(row.getCell(4).value).trim();
    const recurrenteRaw = cellText(row.getCell(5).value).trim();

    // Ignorar filas totalmente vacías.
    if (
      !categoria &&
      !concepto &&
      montoValue == null &&
      !monedaRaw &&
      !recurrenteRaw
    ) {
      return;
    }

    const errores: string[] = [];
    if (!categoria) errores.push(opts.labels.missingCategoria);
    else if (!catSet.has(normKey(categoria)))
      errores.push(opts.labels.badCategoria);

    if (!concepto) errores.push(opts.labels.missingConcepto);

    const monto = parseMonto(montoValue);
    if (!(monto > 0)) errores.push(opts.labels.badMonto);

    let moneda = monedaRaw ? monedaRaw.toUpperCase() : opts.monedaPorDefecto;
    if (monedaRaw && !curSet.has(moneda)) {
      errores.push(opts.labels.badMoneda);
      moneda = opts.monedaPorDefecto;
    }

    out.push({
      fila: rowNumber,
      categoria,
      concepto,
      monto: monto > 0 ? monto : 0,
      montoTexto: cellText(montoValue).trim(),
      moneda,
      recurrente: SI_RE.test(recurrenteRaw),
      errores,
      ok: errores.length === 0,
    });
  });

  return out;
}
