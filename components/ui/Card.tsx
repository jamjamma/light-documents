import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}

export function Card({ title, subtitle, actions, children, className, bodyClassName, padded = true }: Props) {
  const hasHeader = title || subtitle || actions;
  return (
    <section className={clsx("panel", className)}>
      {hasHeader && (
        <header className="flex flex-col gap-3 border-b border-ink-100 px-5 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-ink-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>
          )}
        </header>
      )}
      <div className={clsx(padded && "p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
