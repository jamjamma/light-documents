import { Sparkles } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-ink-100 bg-accent-50 px-6 py-2 text-[12px] text-accent-800">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2">
        <Sparkles className="h-3.5 w-3.5" />
        <span>
          <strong className="font-semibold">Prototype.</strong> Case study build for Light. Signing is simulated, AI clause check is rule-based stand-in, ledger writeback is mocked. The workflow logic, state machine, and routing are real.
        </span>
      </div>
    </div>
  );
}
