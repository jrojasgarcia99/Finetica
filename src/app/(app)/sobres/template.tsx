/**
 * `template.tsx` se re-monta en cada navegación dentro de `/sobres/*`, así que la
 * animación de entrada corre tanto al abrir un sobre como al volver a la lista
 * (slide + fade, sin librería). Se desactiva con prefers-reduced-motion.
 */
export default function SobresTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="animate-sobres-in motion-reduce:animate-none">{children}</div>
  );
}
