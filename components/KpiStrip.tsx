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
    <div className="panel flex items-stretch divide-x divide-ink-100 overflow-hidden">
      {kpis.map((k, i) => (
        <div key={i} className="flex-1 px-5 py-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-500">{k.label}</div>
          <div className={`mt-1 text-2xl font-semibold tracking-tight ${k.emphasis ? "text-rose-500" : "text-ink-900"}`}>
            {k.value}
          </div>
          {k.hint && <div className="mt-1 text-xs text-ink-500">{k.hint}</div>}
        </div>
      ))}
      {trailing && <div className="flex items-center px-5">{trailing}</div>}
    </div>
  );
}
