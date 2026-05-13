import type { ReactNode } from "react";
import { Breadcrumb } from "./Breadcrumb";

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: Crumb[];
}

export function Header({ title, subtitle, actions, breadcrumb }: Props) {
  return (
    <header className="border-b border-ink-100 bg-white px-4 py-4 sm:py-5 md:px-8">
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mb-2">
          <Breadcrumb items={breadcrumb} />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold tracking-tight text-ink-900 sm:text-[22px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
