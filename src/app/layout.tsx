import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finéfica · Presupuesto",
  description: "Diseña, construye y sostén tu libertad financiera.",
};

// Corre de forma síncrona en <head>, antes del primer render, para evitar el
// "parpadeo" de tema: lee la preferencia guardada, o la del sistema.
const THEME_INIT = `(function(){try{var e=document.documentElement,s=localStorage.getItem('theme');var t=(s==='light'||s==='dark')?s:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');e.dataset.theme=t;}catch(_){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
