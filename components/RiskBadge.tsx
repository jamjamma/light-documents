import { Badge } from "./ui/Badge";
import type { Risk } from "@/lib/types";

const RISK_META: Record<Risk, { label: string; tone: "sage" | "amber" | "rose" }> = {
  low: { label: "Low", tone: "sage" },
  medium: { label: "Medium", tone: "amber" },
  high: { label: "High", tone: "rose" },
};

export function RiskBadge({ risk }: { risk: Risk }) {
  const m = RISK_META[risk];
  return (
    <Badge tone={m.tone} leadingDot>
      {m.label}
    </Badge>
  );
}
