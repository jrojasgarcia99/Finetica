import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Finéfica corre en un servidor real (Server Components, Server Actions,
 * sesión por cookie) — no es un sitio estático — así que la app nativa NO
 * empaqueta el sitio adentro del binario. En vez de eso, el WebView carga
 * directamente la app en producción (`server.url`): la app "nativa" es tu
 * Vercel de siempre, con iconos y chrome nativo alrededor.
 *
 * Cambiar `server.url` si el dominio de producción cambia.
 */
const config: CapacitorConfig = {
  appId: "app.finefica.mobile",
  appName: "Finéfica",
  webDir: "www",
  server: {
    url: "https://finetica-khaki.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
