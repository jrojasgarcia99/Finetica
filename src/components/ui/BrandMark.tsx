/**
 * Medallón dorado de Finéfica (marca). Usa el ícono de la app en `public/icons/`.
 * `ring` sutil para que el mosaico se lea sobre fondos navy.
 */
export function BrandMark({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/icon-192.png"
      alt="Finéfica"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-[22%] ring-1 ring-white/10 ${className}`}
    />
  );
}
