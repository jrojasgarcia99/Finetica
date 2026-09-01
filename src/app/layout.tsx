import type { Metadata } from "next";
import "./globals.css";
import { getRequestLocale } from "@/lib/i18n/locale";
import { tFor } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = tFor(await getRequestLocale());
  return { title: t("meta.title"), description: t("meta.description") };
}

// Corre de forma síncrona en <head>, antes del primer render, para evitar el
// "parpadeo" de tema: lee la preferencia guardada, o la del sistema.
const THEME_INIT = `(function(){try{var e=document.documentElement,s=localStorage.getItem('theme');var t=(s==='light'||s==='dark')?s:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');e.dataset.theme=t;}catch(_){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
