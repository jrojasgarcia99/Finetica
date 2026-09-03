import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card border border-border rounded-[var(--radius-card)] shadow-[var(--shadow-card)] ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 border-b border-border flex items-center justify-between gap-3 ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-sm font-semibold tracking-wide uppercase text-navy ${className}`}
      {...props}
    />
  );
}

export function CardBody({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-5 ${className}`} {...props} />;
}
