/** Avatar circular: foto si hay, si no las iniciales del nombre. */
export function Avatar({
  src,
  name,
  size = 36,
  tone = "dark",
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  /** "dark" = sobre chrome navy (barra lateral/superior); "light" = sobre fondo claro. */
  tone?: "dark" | "light";
  className?: string;
}) {
  const initials =
    (name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const toneClass =
    tone === "light" ? "bg-navy text-white" : "bg-white/20 text-white";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${toneClass} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden={!name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? ""}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
