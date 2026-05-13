import type { Approval } from "@/lib/types";
import { Workflow } from "lucide-react";

interface Props {
  approvals: Approval[];
}

export function RoutingPanel({ approvals }: Props) {
  if (approvals.length === 0) {
    return (
      <div className="rounded-lg border border-sage-500/30 bg-sage-50 px-4 py-3 text-[13px] text-ink-700">
        <div className="flex items-center gap-2 font-medium">
          <Workflow className="h-3.5 w-3.5 text-sage-500" />
          No approvals required by routing rules
        </div>
        <div className="mt-1 text-[12px] text-ink-500">
          All clauses standard, value below approval thresholds, document type does not require additional sign-off.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[12px] text-ink-500">
        Triggered by:
      </div>
      <ul className="mt-2 space-y-2">
        {approvals.map((a) => (
          <li key={a.role} className="rounded-lg border border-ink-100 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] font-medium text-ink-900">{a.role}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">{a.channel}</div>
            </div>
            <div className="mt-1 text-[12px] text-ink-600">{a.reason}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
