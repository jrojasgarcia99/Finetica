# Finéfica · Presupuesto

Aplicación web (Next.js + Supabase) que reemplaza el Excel de presupuesto
personal por un sistema con cuentas de usuario reales, pensado para usarse
desde computadora o celular, y para que varias personas de un mismo hogar
compartan un solo presupuesto.

Incluye los mismos módulos y fórmulas que el Excel original: Dashboard,
Presupuesto (por categorías), Patrimonio Neto (con el cálculo PAR/MAR/SAR),
Plan de Deudas (bola de nieve), Fondo de Emergencia, Historial Mensual y
Configuración (metas y parámetros).

## 1. Qué vas a necesitar

Dos cuentas gratuitas:

1. **[Supabase](https://supabase.com)** — la base de datos y el sistema de
   usuarios (login/contraseña). Plan gratuito, sin tarjeta.
2. **[Vercel](https://vercel.com)** — donde la aplicación queda publicada
   con una URL propia. Plan gratuito, sin tarjeta.

Tiempo estimado de configuración inicial: 15–20 minutos, una sola vez.

## 2. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com), crea una cuenta y luego un
   **New Project** (elige cualquier nombre, contraseña de base de datos y
   región cercana a ti).
2. Cuando el proyecto termine de crearse, ve a **SQL Editor** (menú
   izquierdo) → **New query**.
3. Abre el archivo `supabase/schema.sql` de este proyecto, copia todo su
   contenido, pégalo en el editor y presiona **Run**. Esto crea todas las
   tablas, la seguridad a nivel de fila (RLS) y las funciones necesarias.
4. Ve a **Project Settings → API**. Vas a necesitar dos valores de ahí:
   - **Project URL**
   - **anon public key**
5. (Opcional pero recomendado) En **Authentication → Providers → Email**,
   puedes desactivar "Confirm email" si quieres que las cuentas nuevas
   puedan entrar de inmediato sin revisar su correo, útil mientras pruebas
   la app en familia.

## 3. Configurar el proyecto localmente (opcional, solo si quieres probarlo antes de publicarlo)

```bash
npm install
cp .env.local.example .env.local
# Edita .env.local y pega tu Project URL y anon key de Supabase
npm run dev
```

Abre `http://localhost:3000`.

## 4. Publicar en Vercel

1. Sube este proyecto a un repositorio de GitHub (o GitLab/Bitbucket).
2. Entra a [vercel.com](https://vercel.com), **Add New → Project**, e
   importa ese repositorio.
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon public key de Supabase
4. Presiona **Deploy**. En un par de minutos tendrás una URL propia
   (`algo.vercel.app`) que funciona igual en computadora y celular — puedes
   "agregarla a inicio" desde el navegador del celular para que se sienta
   como una app.

Cada vez que quieras actualizar la aplicación, sube los cambios al
repositorio y Vercel la vuelve a publicar automáticamente.

## 5. Cómo funciona el sistema de hogar compartido

- La primera persona crea una cuenta (correo + contraseña) y, en la
  pantalla de bienvenida, crea un **Hogar** (por ejemplo, "Familia Rojas").
  Esto genera un **código de invitación** de 6 caracteres.
- Cualquier otro miembro de la familia crea su propia cuenta (su propio
  correo y contraseña) y, en la misma pantalla, elige **Unirme con un
  código** e ingresa ese código.
- A partir de ahí, ambas cuentas ven y editan el mismo presupuesto,
  patrimonio, deudas, etc. Cada quien puede registrar su propio salario en
  **Hogar → Mi información**, y el código de invitación queda siempre
  visible en esa misma página por si necesitan agregar a alguien más.
- No hay límite de miembros por hogar. Una persona pertenece a un solo
  hogar (no puede estar en dos presupuestos familiares distintos con la
  misma cuenta).

## 6. Estructura del proyecto

```
src/
  app/
    login/, signup/, onboarding/     → autenticación y creación/unión de hogar
    (app)/                            → páginas protegidas (requieren sesión)
      dashboard/, presupuesto/, patrimonio/, deudas/,
      fondo-emergencia/, historial/, hogar/, config/
  components/                         → UI reutilizable (cards, inputs, gráficas, layout)
  lib/
    calculations.ts                   → toda la lógica financiera (ver sección 7)
    supabase/                         → clientes de Supabase (browser, server, middleware)
    data.ts                           → helper que carga el hogar del usuario actual
    types.ts                          → tipos compartidos
supabase/
  schema.sql                          → esquema completo de base de datos + seguridad
```

Cada acción de escritura (agregar un gasto, una deuda, un activo, etc.) es
un **Server Action** de Next.js ubicado en el archivo `actions.ts` de cada
módulo — no hay una API separada que mantener.

## 7. Fidelidad con el Excel original — y diferencias a tener en cuenta

Todas las fórmulas de `src/lib/calculations.ts` están construidas a partir
de las fórmulas auditadas del Excel original (semáforos de Gastos,
Ahorros, Inversión, Jugar, Deuda, Donativos y Formación; el método
PAR/MAR/SAR de Posición Patrimonial; y la simulación de bola de nieve para
las deudas). Dos simplificaciones deliberadas, para que las tengas
presentes:

1. **Gastos del Hogar**: en el Excel existía un mecanismo para prorratear
   gastos compartidos del hogar entre sus miembros. En esta primera
   versión, el módulo "Hogar" gestiona los miembros y sus salarios (útil
   para el cálculo de Patrimonio Deseado y de % de participación), pero
   todavía no incluye un prorrateo de gastos compartidos independiente del
   presupuesto — cada hogar comparte un único presupuesto en vez de tener
   presupuestos individuales que se concilian. Si lo necesitas, es una
   extensión natural para una siguiente iteración.
2. **Historial de deudas**: la página de Historial Mensual muestra la
   columna "Deuda" usando el estado *actual* de tus deudas activas
   aplicado a todos los meses históricos, porque el sistema aún no guarda
   una fotografía mes a mes de cada deuda (el Excel tampoco lo hacía de
   forma automática). El resto de columnas del historial sí reflejan
   exactamente lo que registraste en cada mes.

Ninguna de las dos simplificaciones afecta los cálculos del mes actual en
Dashboard, Presupuesto, Patrimonio Neto o Plan de Deudas — son fieles al
Excel.

## 8. Seguridad de los datos

Cada tabla tiene Row Level Security activado en Supabase: una cuenta solo
puede leer o escribir los datos del hogar al que pertenece, nunca los de
otro hogar. Las contraseñas las gestiona Supabase Auth directamente (nunca
se guardan en texto plano en ninguna tabla de este proyecto).
