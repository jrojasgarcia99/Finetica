import type { MetadataRoute } from "next";

/**
 * Web App Manifest (convención de Next.js App Router: `app/manifest.ts`).
 * Next inyecta solo el `<link rel="manifest" href="/manifest.webmanifest">`.
 * Los íconos viven en `public/icons/`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finéfica",
    short_name: "Finéfica",
    description: "Finéfica — tu presupuesto personal y familiar",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#1f3864",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
