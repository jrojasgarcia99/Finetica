/**
 * TEMPORAL — instrumentación para encontrar dónde se va el tiempo en
 * producción. Envuelve `performance.now()` en funciones normales (nombre en
 * minúscula) para que `react-hooks/purity` no se queje de llamarlo directo
 * dentro de un componente: la regla trata cualquier función capitalizada como
 * componente y no permite llamadas "impuras" en su cuerpo, aunque acá sea un
 * Server Component que corre una sola vez por request (no se re-renderiza).
 * Borrar este archivo y sus usos una vez que ya no haga falta medir.
 */
export function markNow(): number {
  return performance.now();
}

export function elapsedMs(start: number): string {
  return (performance.now() - start).toFixed(0);
}
