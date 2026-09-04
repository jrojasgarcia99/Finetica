import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-light shadow-[var(--shadow-soft)] disabled:opacity-50",
  secondary:
    "bg-white text-navy border border-border hover:bg-gray-50 disabled:opacity-50",
  ghost: "bg-transparent text-navy hover:bg-gray-100 disabled:opacity-50",
  danger: "bg-red text-white hover:opacity-90 shadow-[var(--shadow-soft)] disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
