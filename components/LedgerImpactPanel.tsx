import type { LedgerImpact } from "@/lib/types";
import { Database, ArrowRight } from "lucide-react";

interface Props {
  ledger: LedgerImpact;
}

export function LedgerImpactPanel({ ledger }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-gradient-to-br from-ink-900 to-ink-800 text-white">
      <div className="border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-accent-300">
          <Database className="h-3.5 w-3.5" />
          Light ledger writeback
        </div>
        <div className="mt-1.5 text-lg font-semibold tracking-tight">{ledger.headline}</div>
      </div>
      <div className="divide-y divide-white/10">
        {ledger.rows.map((row, i) => (
          <div key={i} className="flex items-start justify-between gap-4 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-white/50">{row.label}</div>
              <div className="mt-0.5 font-medium tabular-nums text-white">{row.value}</div>
            </div>
            {row.note && (
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <ArrowRight className="h-3 w-3" />
                {row.note}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 bg-white/5 px-5 py-2.5 text-[11px] text-white/60">
        <span className="font-medium text-accent-300">Demo:</span> simulated ledger entry in this prototype. Production writes to Light's general ledger via internal API.
      </div>
    </div>
  );
}
