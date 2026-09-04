import { Loader2 } from "lucide-react";

/**
 * Fallback de Suspense para toda navegación dentro de (app). Next.js muestra
 * esto de inmediato, sin esperar a que la página de destino termine de traer
 * sus datos de Supabase — así el cambio de pantalla se siente instantáneo en
 * vez de quedar "congelado" en la pantalla anterior mientras carga.
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 size={28} className="animate-spin text-navy-light" />
    </div>
  );
}
