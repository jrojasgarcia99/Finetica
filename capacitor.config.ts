import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Finéticap corre en un servidor real (Server Components, Server Actions,
 * sesión por cookie) — no es un sitio estático — así que la app nativa NO
 * empaqueta el sitio adentro del binario. En vez de eso, el WebView carga
 * directamente la app en producción (`server.url`): la app "nativa" es tu
 * Vercel de siempre, con iconos y chrome nativo alrededor.
 *
 * Cambiar `server.url` si el dominio de producción cambia.
 */
const config: CapacitorConfig = {
  appId: "app.fineticap.mobile",
  appName: "Finéticap",
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
