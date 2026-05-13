import type { ReactNode } from "react";

interface Kpi {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

interface Props {
  kpis: Kpi[];
  trailing?: ReactNode;
}

export function KpiStrip({ kpis, trailing }: Props) {
  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-y divide-ink-100 sm:flex sm:items-stretch sm:divide-y-0">
        {kpis.map((k, i) => (
          <div
            key={i}
            className={`px-4 py-3 sm:flex-1 sm:px-5 sm:py-4 ${i < 2 ? "sm:border-t-0" : ""}`}
          >
            <div className="text-[11px] uppercase tracking-wider text-ink-500">{k.label}</div>
            <div className={`mt-1 text-xl font-semibold tracking-tight sm:text-2xl ${k.emphasis ? "text-rose-500" : "text-ink-900"}`}>
              {k.value}
            </div>
            {k.hint && <div className="mt-1 text-[11px] leading-snug text-ink-500 sm:text-xs">{k.hint}</div>}
          </div>
        ))}
        {trailing && <div className="col-span-2 flex items-center border-t border-ink-100 px-4 py-3 sm:col-auto sm:border-t-0 sm:px-5">{trailing}</div>}
      </div>
    </div>
  );
}
