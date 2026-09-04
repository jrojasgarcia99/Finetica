import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";
import { InfoHint } from "@/components/ui/Tooltip";

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-xs font-medium text-gray-500 mb-1 ${className}`}
      {...props}
    />
  );
}

const CONTROL_CLASS =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-navy-light/40 focus:border-navy-light";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL_CLASS} ${className}`} {...props} />;
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${CONTROL_CLASS} ${className}`} {...props} />;
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  // min-w-0: sin esto, un hijo con ancho intrínseco grande (p. ej. <input
  // type="date">) puede desbordar su celda en un grid/flex en vez de encogerse.
  return (
    <div className={`min-w-0 ${className}`}>
      <Label className="flex items-center gap-1">
        {label}
        {hint ? <InfoHint content={hint} /> : null}
      </Label>
      {children}
    </div>
  );
}
