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
    <header className="border-b border-ink-100 bg-white py-4 pl-16 pr-4 sm:py-5 sm:pl-16 sm:pr-6 md:pl-8 lg:px-8">
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mb-2">
          <Breadcrumb items={breadcrumb} />
        </div>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900 tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
