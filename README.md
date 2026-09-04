# Finéfica

App web de finanzas personales (Next.js 16 + Supabase). Reemplaza un Excel de
presupuesto por un sistema con cuentas reales, pensado phone-first, con un
**espacio personal privado** por cuenta y un **Presupuesto Familiar** opcional y
compartido.

Módulos: Panel, Presupuesto (categorías editables), Sobres (envelope budgeting),
Patrimonio Neto (PAR/MAR/SAR), Plan de Deudas (bola de nieve + pago mensual
real), Fondo de Emergencia, Historial, Presupuesto Familiar, Perfil,
Configuración.

> Este README es la documentación viva del proyecto. Se actualiza con cada
> cambio de arquitectura. La sección [Pendiente para producción](#pendiente-para-producción)
> junta lo que falta configurar fuera del código.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16.3.x (App Router, React 19, Server Components + Server Actions) |
| Base de datos / Auth / Storage | Supabase (Postgres + RLS, Supabase Auth, Storage) |
| Estilos | Tailwind v4 (tokens CSS en `src/app/globals.css`), modo claro/oscuro |
| Librerías | `@dnd-kit/*` (drag & drop), `recharts` (gráficos), `react-easy-crop` (recorte de avatar), `lucide-react` (íconos) |
| Deploy | Vercel (Hobby) |

Sin API propia: cada escritura es un **Server Action** en el `actions.ts` de su
módulo. Sin ORM: se usa el cliente de `@supabase/ssr` directo.

---

## Arquitectura

### Rutas

```
src/app/
  login/  signup/  onboarding/     → sin sesión (o sesión sin perfil completo)
  auth/callback/route.ts           → OAuth / magic link: exchangeCodeForSession(?code)
  auth/confirm/route.ts            → confirmación de correo: verifyOtp(?token_hash&type)
  api/budget-xlsx/route.ts         → descarga .xlsx: plantilla / exportación del mes
  (app)/                           → requieren sesión + perfil completo
    dashboard/  presupuesto/  sobres/ (+ sobres/nuevo, sobres/[id])
    patrimonio/  deudas/  fondo-emergencia/  historial/  familiar/
    perfil/  config/
```

- **`src/app/page.tsx`** (raíz): si no hay sesión → `/login`; si el perfil está
  incompleto → `/onboarding`; si no → redirige a la 1ª pantalla de `nav_order`.
- **`src/app/(app)/layout.tsx`**: `getPersonalContext()` + guarda de onboarding
  (`!genero || !fecha_nacimiento` → `/onboarding`) + monta `<AppShell>`.
- **`src/proxy.ts` / `src/lib/supabase/middleware.ts`**: refresca la sesión y
  redirige a `/login` lo no público (`/login`, `/signup`, `/auth`).

### Contexto por request

- **`getPersonalContext()`** (`src/lib/data.ts`) → `{ supabase, user, space, currency, locale }`.
  Crea el `personal_spaces` con `upsert(onConflict: owner_id)` si no existe
  (siembra `idioma` desde la cookie). Es la puerta de entrada de casi todas las
  páginas y actions personales.
- **`getFamilyBudgetContext()`** → `{ supabase, user, familyBudget, members, currency }` o `null`.
- **`getFamilyRepartoContext(personalCurrency)`** → `shareFor(mes,anio)` y
  `detalle(mes,anio)` para el reparto proporcional familiar.

### AppShell y navegación

- `src/components/layout/nav-items.ts`: `NAV_ITEMS` (lista maestra + orden por
  defecto) y `resolveNavItems(stored)`.
- El usuario reordena el menú en Configuración → se guarda en
  `personal_spaces.nav_order` (array de rutas). **1ª ruta = pantalla de inicio**;
  **primeras 5 = barra inferior del teléfono**.
- `(app)/layout.tsx` pasa `navOrder: string[]` (no los íconos: no se pueden
  serializar funciones al cliente).
- Barra lateral (escritorio) / barra superior + drawer (móvil). Avatar circular
  junto al nombre → link a `/perfil`. Safe-area de iPhone contemplada
  (`env(safe-area-inset-*)`, `viewport-fit=cover`).

### i18n

- Diccionarios `const` en `src/lib/i18n/es.ts` y `en.ts` (mismas claves; `TKey`
  se deriva de `es`). Interpolación `{var}`.
- Servidor: `tFor(locale)`. Cliente: `useT()` / `useLocale()` vía `<I18nProvider>`.
- Idioma efectivo: **en la app** = `personal_spaces.idioma`; **sin sesión** =
  cookie `finefica_lang` → `Accept-Language` → `es` (`getRequestLocale()`).
- Se elige con las banderas 🇪🇸/🇬🇧 arriba a la derecha en login/registro/
  onboarding (`AuthLangFlags`): setean la cookie y recargan. Al completar el
  onboarding, ese idioma se persiste en `personal_spaces.idioma`.

### Diseño (forma)

Tokens en `globals.css`: `--radius-card` (18px), `--shadow-card`, `--shadow-soft`.
Botones píldora (`rounded-full`), inputs `rounded-xl`, insignias cuadradas
redondeadas, `MonthSwitcher` como control segmentado.

### Temas de color (dos ejes independientes)

1. **Claro / oscuro** — `<html data-theme="light|dark">`. Vive sólo en el
   navegador (`localStorage 'theme'`), lo pone el script síncrono del layout raíz
   y lo cambia `ThemeToggle` (interruptor rápido, siempre visible).
2. **Tema de color** — `<html data-palette="clasico|rosa|lavanda|menta|cielo|arena">`.
   Se elige en **Configuración → Apariencia** (`AppearanceCard`). Cada tema tiene
   su versión clara y oscura y redefine los mismos tokens semánticos que el
   Clásico (`--background --foreground --card --border --navy --gold …`) en
   bloques `:root[data-palette="X"]` y `:root[data-palette="X"][data-theme="dark"]`.
   Contraste verificado WCAG AA (4.5:1 texto normal, 3:1 grande). Los colores de
   semáforo (`--green --amber --orange --red`) **no** cambian con el tema.
   - Fuente de verdad: `personal_spaces.tema`. Cookie de vía rápida
     `finefica_palette` (igual patrón que `finefica_lang`): el layout raíz la lee
     para pintar `data-palette` sin parpadeo; `updateTema` escribe base + cookie;
     `PaletteBoot` reconcilia al abrir la app (primer login en otro dispositivo).
   - Los remapeos de utilidades crudas de Tailwind en modo oscuro se apoyan en
     tokens `--d-heading --d-link --d-surf-1/2/3` que cada tema tiñe.
   - Datos del selector (colores de la miniatura, claves i18n) en `src/lib/theme.ts`.

- **`MoneyInput`** (`src/components/ui/MoneyInput.tsx`): campo de monto que
  muestra separadores de miles es-CR mientras se teclea (`1000000` → `1.000.000`)
  pero envía el número limpio en un `<input hidden name>`; el campo visible es
  sólo presentación. Lo usan `MontoConMoneda` (Presupuesto personal + familiar,
  Patrimonio) y los formularios de movimientos de Sobres. `toDisplay` / `toClean`
  hacen la conversión; el valor guardado en la base nunca lleva puntos.

- **`MoneyInput`** (`src/components/ui/MoneyInput.tsx`): campo de monto que
  muestra separadores de miles es-CR mientras se teclea (`1000000` → `1.000.000`)
  pero envía el número limpio en un `<input hidden name>`; el campo visible es
  sólo presentación. Lo usan `MontoConMoneda` (Presupuesto personal + familiar,
  Patrimonio) y los formularios de movimientos de Sobres. `toDisplay` / `toClean`
  hacen la conversión; el valor guardado en la base nunca lleva puntos.

---

## Autenticación y alta

1. **Registro** (correo+contraseña o **Google**). El idioma va como
   `data.lang` en `signUp` (para la plantilla del correo) y en la cookie.
   - Si el correo ya existe: se detecta `data.user.identities.length === 0` y se
     avisa "ese correo ya tiene cuenta".
   - Sin sesión (pide confirmación) → pantalla amigable `/signup?sent=1`.
2. **Confirmación de correo** → enlace a `{{ .SiteURL }}/auth/confirm?token_hash=…&type=signup`
   → `verifyOtp` (no depende de cookie, sirve entre dispositivos) → sesión → `/`.
   `/auth/callback` cubre el flujo `?code` (Google, magic link).
3. **Onboarding** (`/onboarding`, fuera de `(app)`): nombre preferido, segundo
   nombre (opc.), apellidos, profesión (lista `PROFESIONES`), género, fecha de
   nacimiento (**3 listas día/mes/año, mínimo 15 años**, validado también en
   servidor). `completeOnboarding` hace `upsert` en `personal_spaces`
   (crea la fila si el usuario nuevo aún no la tiene) e incluye `idioma`.
4. Perfil completo → la app abre en la pantalla de inicio del usuario.

Cerrar sesión: solo dentro de `/perfil`.

---

## Modelo de datos

Esquema completo y RLS en **`supabase/schema.sql`**. Cambios incrementales en
**`supabase/migrations/`** (ver [Migraciones](#migraciones)).

### Espacio personal

| Tabla | Qué guarda |
|---|---|
| `personal_spaces` | 1 fila por cuenta (`owner_id` único). Perfil (`display_name` = nombre preferido, `segundo_nombre`, `apellidos`, `profesion`, `genero`, `fecha_nacimiento`, `avatar_path`), `idioma`, `nav_order`, monedas (`monedas_activas`, `moneda_primaria`, `tipo_cambio`), `salario_mensual` + `salario_fuente` (`disponible`\|`fijo`), `meta_deuda`, `meses_fondo_basico/ideal`, `fondo_acumulado`, `pago_extra_base`. |
| `personal_budget_categories` | Categorías editables del presupuesto personal: `clave` (estable), `nombre` (visible), `tipo` (`maximo`\|`minimo`), `meta` (fracción), `orden`. Ingresos/Rebajos NO están acá (son estructurales en código); Deuda tampoco (deriva de `deudas`). |
| `budget_items` | Líneas del presupuesto personal por mes. `categoria` = una `clave` (`ingresos`, `rebajos` o `personal_budget_categories.clave`), sin CHECK. |
| `activos`, `pasivos` | Patrimonio: activos y pasivos varios (las deudas van aparte). |
| `deudas` | Plan de Deudas. `estado` (`Activa`\|`Pagada`), `saldo_actual`, `cuota_minima`, `tasa_interes_anual`, `moneda`. |
| `debt_payments` | Historial real del pago mensual: por `(deuda_id, anio, mes)` → `interes`, `capital`, `extra_aplicado`, `saldo_resultante`. Lo escribe `rollover_debts`. |
| `payment_methods` | Métodos de pago **por cuenta** (`user_id`). Se siembran 5 por defecto. |
| `envelopes` | Sobres. `scope_type` (`personal`\|`family`) + `space_id`/`family_budget_id`, `nombre`, `categoria`, `moneda`, `limite_mensual`, `icono`, `reinicio_dia` (null = fin de mes), `ciclo_inicio`, `source_budget_item_id` / `source_family_budget_item_id` (la línea de presupuesto de la que nace: los movimientos NO crean líneas nuevas). |
| `envelope_movements` | Movimientos dentro de un sobre: `tipo` (`income`\|`expense`), `descripcion`, `monto`, `moneda`, `fecha`, `metodo_pago` (texto snapshot). |

### Presupuesto Familiar (opcional, compartido)

| Tabla | Qué guarda |
|---|---|
| `family_budgets` | 1 por familia. `invite_code`, config de monedas propia. |
| `family_budget_members` | `unique(user_id)` → una cuenta = a lo sumo un familiar. |
| `family_budget_categories` | Categorías (nombre libre) del familiar. |
| `family_budget_items` | Líneas del familiar por mes. |

### Otros

| Tabla | Qué guarda |
|---|---|
| `rollover_log` | Bitácora del rollover mensual (`scope_type`, `scope_id`, `anio`, `mes`) — evita cobrar dos veces. |

### Funciones SQL

- `owns_space(uuid)`, `is_family_member(uuid)` — helpers de RLS (`SECURITY DEFINER`).
- `generate_invite_code()`, `create_family_budget()`, `join_family_budget(code)`, `leave_family_budget()`.
- `family_budget_roster()` — nombres, salarios y `salario_fuente` de los co-miembros.
- `family_member_disponible()` — Ingreso Disponible por miembro y por mes (para el reparto dinámico).
- **Rollover mensual** (ver abajo): `rollover_recurring(scope, id, anio, mes)`,
  `rollover_debts(space, anio, mes)`, `envelope_period_start(dia, hoy)`,
  `reset_due_envelopes()`, `run_monthly_rollover(anio?, mes?)`, `rollover_for_me(anio, mes)`.

### Storage

- Bucket **`avatars`** (público). Objetos en `{auth.uid()}/…`. Políticas:
  lectura pública; escribir/borrar solo en la carpeta propia. La foto se sube
  recortada (cuadrada, JPEG ≤ 512px) desde `/perfil` con `react-easy-crop`.

---

## Rollover mensual (automático)

`run_monthly_rollover()` corre **a diario** vía `pg_cron`
(`finetica-monthly-rollover`, `0 7 * * *` UTC). Por cada espacio/familiar, si el
mes no está en `rollover_log`:

1. `reset_due_envelopes()` — adelanta el `ciclo_inicio` de los sobres cuyo
   período venció (idempotente).
2. `rollover_recurring` — copia las líneas `recurrente = true` del último mes al
   mes en curso (si está vacío).
3. `rollover_debts` (solo personal) — aplica interés + cuota mínima + cascada de
   `pago_extra_base` a `deudas.saldo_actual` y registra el desglose en
   `debt_payments`. `capital = saldo_antes − max(saldo_nuevo, 0)`.

`rollover_for_me(anio, mes)` lo llama la app al abrir el presupuesto (solo
recurrentes, sin tocar deudas ni el log).

**Setup una sola vez:** activar `pg_cron` en Supabase (Database → Extensions) y
correr el `select cron.schedule(...)` de `supabase/migrations/2026-09-03_rollover_mensual.sql`.

---

## Motor de cálculo (`src/lib/calculations.ts`)

- `calcularTotales(items, deudas, categorias, mes, anio, aporteFamiliar)` →
  `ingresoDisponible`, `porCategoria`, `totalMaximo`, `totalMinimo`,
  `totalAsignado`, `deuda`, `aporteNoAsignado`, `balance`. **El aporte al
  Presupuesto Familiar se suma dentro de `gastos`** (aparece en el total de esa
  categoría y como sub-fila); si no existe la categoría `gastos`, se resta suelto
  en el balance (`aporteNoAsignado`).
- `semaforoCategoria(pct, meta, tipo)` — 2 tipos: `maximo` (querés quedar debajo)
  / `minimo` (querés alcanzar).
- `calcularSemaforos`, `saludFinancieraGeneral` — genéricos sobre la lista de
  categorías + Deuda.
- `calcularFondoEmergencia` — `gastoMensualReal = Σ(maximo) + aporteNoAsignado +
  deuda` (el aporte ya va dentro de `Σ(maximo)` vía `gastos`);
  `ahorroMensualDisponible = Σ(minimo)`.
- `calcularPosicionPatrimonial(salarioAnual, edad, patrimonioNeto)` +
  `edadDesde(fechaNacimiento)` — la edad sale del Perfil (no hay campo manual).
- `simularSnowball` — plan bola de nieve mes a mes (proyección) + `capitalDelMes`
  y `mesLiquidacionPorDeuda`.

---

## Asistente de IA

La asistente se llama **Lía** (persona definida en el system prompt; avatar en
`public/lia.svg`). Botón flotante (`AssistantWidget`, esquina inferior derecha) en
todas las páginas de `(app)`. Abre un drawer lateral en escritorio y pantalla
completa en celular (`AssistantPanel`).

- **Historial** — una única instancia `Chat` (`@ai-sdk/react`) vive en
  `AssistantWidget` mientras la página está cargada: sobrevive a cerrar/abrir el
  panel y a navegar entre páginas de `(app)` (el layout no se desmonta). Se
  **reinicia al recargar** la página (o con el botón «Nueva conversación»). No se
  persiste en storage.

- **Proveedor** — Vercel AI SDK (`ai`) + `@ai-sdk/openai`. El proveedor se cambia
  editando una sola línea en `src/app/api/assistant/route.ts` (`openai(MODEL)` →
  otro provider). Modelo por defecto `gpt-4o-mini`, ajustable con
  `OPENAI_ASSISTANT_MODEL`. **Todo corre en el servidor** (route handler
  `POST /api/assistant`); `OPENAI_API_KEY` nunca llega al navegador. Respuesta en
  **streaming** (`streamText(...).toUIMessageStreamResponse()` ↔ `useChat`).
- **Contexto financiero** — `assembleAssistantPayload()`
  (`src/lib/assistant/context.ts`) arma un resumen compacto del mes actual
  (ingreso disponible, balance, por categoría con semáforo y meta, cuotas de
  deuda, salud general, patrimonio neto + posición PAR/MAR/SAR, saldo de deudas +
  meses para libertad de la bola de nieve, sobres con su disponible, Fondo de
  Emergencia). Ese texto va como parte del system prompt — no el historial crudo.
- **Instrucciones personalizadas** — `personal_spaces.asistente_instrucciones`
  (texto libre, editable en **Configuración → Asistente IA**, `AssistantSettingsCard`).
  Se inyecta en el system prompt de cada conversación (`buildSystemPrompt`).
- **Reglas** — el system prompt lo limita a explicar los números propios y la
  metodología (educativo/descriptivo); nunca asesoría de inversión ni consejo
  como asesor licenciado. Si se lo piden, lo aclara y sugiere un profesional.
- **Tope de uso** — `assistant_bump_usage(space_id, limit)` (SECURITY DEFINER,
  incremento atómico por día en `assistant_usage`); por defecto **50 mensajes /
  cuenta / día** (`OPENAI_ASSISTANT_DAILY_LIMIT`). Al pasarse, el handler
  responde `429` y el panel muestra el aviso. También se recorta el historial
  (últimos 24 mensajes, 4 000 chars c/u) y la salida (`maxOutputTokens: 700`).
- **Env** — `OPENAI_API_KEY` (obligatoria; el botón no aparece si falta),
  `OPENAI_ASSISTANT_MODEL`, `OPENAI_ASSISTANT_DAILY_LIMIT` (opcionales).

---

## Importar / exportar Excel (Presupuesto)

Cada Presupuesto (personal y familiar) tiene una barra **Excel** con tres
acciones. Cada ámbito trabaja sólo con su propia info.

- **Descargar plantilla** — `GET /api/budget-xlsx?scope=personal|family&mode=template`.
  `.xlsx` en blanco con columnas **Categoría · Concepto · Monto · Moneda ·
  Recurrente** y **validación de datos (listas desplegables)** en Categoría,
  Moneda y Recurrente (Sí/No). Los valores válidos viven en una hoja oculta
  `Listas` referenciada por las validaciones.
- **Exportar** — `…&mode=export&mes=&anio=`. Baja las líneas **del mes que se
  está viendo** (no todo el historial) con las mismas columnas, para editarlas
  afuera y volver a importarlas.
- **Importar Excel** — flujo en dos pasos con Server Actions
  (`src/app/(app)/presupuesto/xlsx-actions.ts`):
  1. `previewBudgetImport(formData)` — lee y valida el archivo **sin guardar
     nada** (recibe también `mes`/`anio`); devuelve filas con sus errores:
     categoría/concepto faltante, monto/moneda inválidos y **repetidos** (misma
     categoría + mismo concepto que otra línea del mes o del propio archivo,
     `dupKey` en `xlsx-budget.ts`). El cliente (`BudgetIO`) muestra la vista
     previa (cuántas filas, cuáles con problemas).
  2. `commitBudgetImport({scope, mes, anio, rows})` — al confirmar, revalida
     contra las categorías de confianza del servidor, **vuelve a descartar los
     repetidos** e inserta cada fila como **una línea nueva en el mes visible**
     (`automatico:false`, `orden` al final de su categoría). Nunca reemplaza ni
     empareja: sólo agrega.

  La validación de moneda distingue dos casos: texto que no es `CRC` ni `USD`
  («moneda no válida») y una moneda real que el presupuesto no tiene activa
  («{moneda} no está habilitada en este presupuesto — actívala en Configuración»).
  La lista de Moneda de la exportación incluye las activas + las que ya aparezcan
  en las líneas exportadas (para no disparar la validación de Excel en un ida y
  vuelta).

`src/lib/xlsx-budget.ts` construye/lee los libros con **`exceljs`** (soporta las
listas desplegables); `src/lib/budget-io.ts` une la lógica común de los dos
ámbitos (`getScopeContext(scope)` → `categoriaNames`, `resolveCategoria`,
`readMonth`, `insertItems`). `exceljs` es sólo de servidor: nunca entra al bundle
del cliente.

---

## Migraciones

`supabase/schema.sql` es el estado consolidado (para instalación nueva). Sobre
una base ya creada, correr en orden los archivos de `supabase/migrations/`:

| Archivo | Qué hace |
|---|---|
| `paso_1-3_esquema` / `paso_4-7_datos` / `paso_8_cerrar` | Migración original a espacios personales + Presupuesto Familiar. |
| `fix_encoding_categorias` | Arreglo de acentos mal guardados. |
| `2026-09-01_personal_spaces_y_familiar` | Espacios personales / familiar. |
| `2026-09-02_orden_idioma_recurrente` | `orden`, `idioma`, `recurrente`. |
| `2026-09-03_rollover_mensual` | `rollover_log` + funciones + `pg_cron`. |
| `2026-09-04_debt_payments` | Historial de pago de deudas; `rollover_debts(space,anio,mes)`. |
| `2026-09-05_sobres` | `payment_methods`, `envelopes`, `envelope_movements`, `envelope_period_start`, `reset_due_envelopes`. |
| `2026-09-06_sobres_ligados` | `envelopes.source_*`; los movimientos dejan de crear líneas. |
| `2026-09-07_categorias_personales` | `personal_budget_categories`; `budget_items.categoria` a texto libre; se quitan `meta_*` de `personal_spaces` (queda `meta_deuda`). |
| `2026-09-08_nav_order` | `personal_spaces.nav_order`. |
| `2026-09-09_perfil` | `genero`, `fecha_nacimiento`, `avatar_path`; drop `patrimonio_edad`; bucket `avatars` + políticas. |
| `2026-09-10_perfil_nombre` | `segundo_nombre`, `apellidos`, `profesion`. |
| `2026-09-11_salario_fuente` | `salario_fuente`; `family_budget_roster` (+fuente); `family_member_disponible()`. |
| `2026-09-12_tema_apariencia` | `personal_spaces.tema` (tema de color). |
| `2026-09-13_asistente_ia` | `personal_spaces.asistente_instrucciones`; `assistant_usage` + `assistant_bump_usage()` (tope diario). |

---

## Desarrollo local

```bash
npm install
# .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   OPENAI_API_KEY=...                     # asistente IA (solo servidor)
#   OPENAI_ASSISTANT_MODEL=gpt-4o-mini     # opcional
#   OPENAI_ASSISTANT_DAILY_LIMIT=50        # opcional
npm run dev            # http://localhost:3000
npx tsc --noEmit && npx eslint src && npx next build   # verificación
```

## Deploy (Vercel)

1. Repo en GitHub → Vercel → Add New Project.
2. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `OPENAI_API_KEY` (+ `OPENAI_ASSISTANT_MODEL` / `OPENAI_ASSISTANT_DAILY_LIMIT`
   si querés cambiarlos).
3. Deploy. Cada push a `main` re-despliega.

---

## Pendiente para producción

Cosas fuera del código, en los paneles de Supabase / Google. El código ya las
soporta.

### ✅ Hecho
- **Supabase → Auth → URL Configuration**: Site URL = dominio de producción;
  Redirect URLs incluyen `https://DOMINIO/auth/callback`, `.../auth/confirm` y
  las variantes `localhost:3000`.

### ⏳ Requiere Supabase Pro
- **Plantilla del correo de confirmación** (Auth → Email Templates → *Confirm
  signup*). En plan gratis no se puede editar. HTML listo (navy/dorado,
  bilingüe con `{{ if eq .Data.lang "en" }}`, botón a
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`) —
  guardado abajo en [Plantilla de correo](#plantilla-de-correo-guardada).
- (Opcional) **SMTP propio** (Auth → SMTP Settings) para no depender del correo
  compartido de Supabase (rate limit ~3–4/hora, remitente genérico).

### ⏳ Google OAuth "de producción"
Ahora funciona con credenciales de prueba. Para producción:
1. **Google Cloud Console** → OAuth consent screen (External, publicar) →
   Credentials → OAuth client ID *Web application*:
   - Authorized JavaScript origins: `https://DOMINIO`
   - Authorized redirect URIs: `https://<REF>.supabase.co/auth/v1/callback`
2. **Supabase → Auth → Providers → Google**: Enable + Client ID + Client Secret.

### Plantilla de correo guardada

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f5f7;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table width="440" cellpadding="0" cellspacing="0" role="presentation" style="max-width:440px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
      <tr><td style="background:#1f3864;padding:22px 32px;">
        <span style="color:#d4af37;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Finéfica</span>
      </td></tr>
      <tr><td style="padding:32px;">
        {{ if eq .Data.lang "en" }}
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#1f3864;">Confirm your email</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.65;color:#4b5563;">Welcome to Finéfica. Tap the button to confirm <strong>{{ .Email }}</strong> and start building your financial system.</p>
        <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup" style="display:inline-block;background:#1f3864;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 30px;border-radius:999px;">Confirm email</a>
        <p style="margin:26px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">If you didn't create this account, you can safely ignore this email.</p>
        {{ else }}
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#1f3864;">Confirmá tu correo</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.65;color:#4b5563;">Bienvenido a Finéfica. Tocá el botón para confirmar <strong>{{ .Email }}</strong> y empezar a construir tu sistema financiero.</p>
        <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup" style="display:inline-block;background:#1f3864;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 30px;border-radius:999px;">Confirmar correo</a>
        <p style="margin:26px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">Si no creaste esta cuenta, podés ignorar este correo.</p>
        {{ end }}
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
        <span style="font-size:11px;color:#9ca3af;">{{ if eq .Data.lang "en" }}Finéfica &middot; Financial freedom is built, not found.{{ else }}Finéfica &middot; La libertad financiera se construye, no se encuentra.{{ end }}</span>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## Convenciones

- **SQL**: cambios de esquema en bloques incrementales numerados en
  `supabase/migrations/AAAA-MM-DD_nombre.sql`; `schema.sql` se edita de forma
  puntual (no se reescribe entero). Se corren a mano en el SQL Editor.
- **Escrituras**: Server Actions en `actions.ts` por módulo; `revalidatePath` de
  las superficies afectadas. Única excepción de Route Handler:
  `api/budget-xlsx/route.ts`, que **devuelve un archivo** (`.xlsx`) y no muta nada.
- **i18n**: toda cadena visible va a `es.ts` y `en.ts` con la misma clave.
- **Verificación antes de commit**: `tsc --noEmit`, `eslint src`, `next build` en verde.
- Al terminar un cambio de arquitectura, **actualizar este README**.
