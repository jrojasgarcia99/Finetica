import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { getRequestLocale } from "@/lib/i18n/locale";
import { tFor } from "@/lib/i18n";
import { PALETTE_COOKIE, normalizeTema, THEME_MODE_COOKIE, normalizeThemeMode } from "@/lib/theme";
import { NoZoom } from "@/components/layout/NoZoom";

// URL base para resolver rutas relativas de openGraph/twitter a URLs absolutas.
// En Vercel se usa el dominio de producción automáticamente; se puede forzar con
// NEXT_PUBLIC_SITE_URL (p. ej. un dominio propio).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export async function generateMetadata(): Promise<Metadata> {
  const t = tFor(await getRequestLocale());
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: "Finéfica",
    appleWebApp: {
      capable: true,
      title: "Finéfica",
      statusBarStyle: "default",
    },
    other: { "apple-mobile-web-app-capable": "yes" },
    openGraph: {
      type: "website",
      siteName: "Finéfica",
      title,
      description,
      images: [
        { url: "/icons/og-image.png", width: 1200, height: 630, alt: "Finéfica" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/icons/og-image.png"],
    },
  };
}

// viewport-fit=cover para que env(safe-area-inset-*) tenga valor en iPhone.
// Sin zoom: se siente como app y evita que la barra inferior fija "se despegue"
// al hacer pinch-zoom en iOS.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1f3864",
};

// Corre de forma síncrona en <head>, antes del primer render, solo hace falta
// si el servidor no pudo mandar ya el data-theme resuelto (cookie ausente, p.
// ej. primera visita): lee la preferencia guardada, o la del sistema, y
// escribe la cookie para que de ahí en adelante lo resuelva el servidor.
const THEME_INIT = `(function(){try{var e=document.documentElement,s=localStorage.getItem('theme');var t=(s==='light'||s==='dark')?s:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');e.dataset.theme=t;try{localStorage.setItem('theme',t);}catch(_){}document.cookie='finefica_theme_mode='+t+';path=/;max-age=31536000;samesite=lax';}catch(_){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, cookieStore] = await Promise.all([getRequestLocale(), cookies()]);
  const palette = normalizeTema(cookieStore.get(PALETTE_COOKIE)?.value);
  const themeMode = normalizeThemeMode(cookieStore.get(THEME_MODE_COOKIE)?.value);
  return (
    <html
      lang={locale}
      data-palette={palette}
      data-theme={themeMode ?? undefined}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NoZoom />
        {children}
      </body>
    </html>
  );
}
