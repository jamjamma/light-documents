import { Badge } from "./ui/Badge";
import type { Stage } from "@/lib/types";

const STAGE_META: Record<Stage, { label: string; tone: "neutral" | "amber" | "rose" | "sage" | "slate" | "ink" }> = {
  draft: { label: "Draft", tone: "slate" },
  needs_info: { label: "Needs info", tone: "amber" },
  checks_running: { label: "Running checks", tone: "amber" },
  in_review: { label: "In review", tone: "amber" },
  awaiting_approval: { label: "Awaiting approval", tone: "amber" },
  ready_to_send: { label: "Ready to send", tone: "sage" },
  sent: { label: "Sent", tone: "neutral" },
  signed: { label: "Signed", tone: "sage" },
  filed: { label: "Filed", tone: "sage" },
};

export function StatusBadge({ stage }: { stage: Stage }) {
  const m = STAGE_META[stage];
  return (
    <Badge tone={m.tone} leadingDot>
      {m.label}
    </Badge>
  );
}
