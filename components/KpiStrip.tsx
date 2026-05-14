import type { ReactNode } from "react";
import clsx from "clsx";

interface Kpi {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
  /** If supplied, the tile renders as a button that triggers this handler. */
  onClick?: () => void;
  /** Visually highlight this tile (paired with onClick to indicate active filter). */
  active?: boolean;
}

interface Props {
  kpis: Kpi[];
  trailing?: ReactNode;
}

export function KpiStrip({ kpis, trailing }: Props) {
  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-y divide-ink-100 sm:flex sm:items-stretch sm:divide-y-0">
        {kpis.map((k, i) => {
          const interactive = !!k.onClick;
          const inner = (
            <>
              <div className="text-[11px] uppercase tracking-wider text-ink-500">{k.label}</div>
              <div
                className={clsx(
                  "mt-1 text-xl font-semibold tracking-tight sm:text-2xl",
                  k.emphasis ? "text-rose-500" : "text-ink-900",
                )}
              >
                {k.value}
              </div>
              {k.hint && <div className="mt-1 text-[11px] leading-snug text-ink-500 sm:text-xs">{k.hint}</div>}
            </>
          );
          const cls = clsx(
            "px-4 py-3 text-left sm:flex-1 sm:px-5 sm:py-4",
            i < 2 ? "sm:border-t-0" : "",
            interactive && "transition-colors hover:bg-ink-50",
            k.active && "bg-ink-900/[0.03] ring-1 ring-inset ring-ink-900/15",
          );
          if (interactive) {
            return (
              <button
                key={i}
                type="button"
                onClick={k.onClick}
                aria-pressed={k.active}
                className={cls}
              >
                {inner}
              </button>
            );
          }
          return (
            <div key={i} className={cls}>
              {inner}
            </div>
          );
        })}
        {trailing && <div className="col-span-2 flex items-center border-t border-ink-100 px-4 py-3 sm:col-auto sm:border-t-0 sm:px-5">{trailing}</div>}
      </div>
    </div>
  );
}
