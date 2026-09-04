export function PageHeader({
  title,
  action,
}: {
  title: string;
  /** Ya no se muestra: se dejó el prop para no romper las llamadas existentes. */
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl md:text-2xl font-semibold text-navy">{title}</h1>
      {action}
    </div>
  );
}
