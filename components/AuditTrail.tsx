import type { AuditEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { CheckCircle2, MessageSquare, Send, Eye, FileSignature, FileCheck, Cog } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  events: AuditEvent[];
}

function iconForEvent(event: string): ReactNode {
  const e = event.toLowerCase();
  if (e.includes("created")) return <FileCheck className="h-3.5 w-3.5" />;
  if (e.includes("approved")) return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (e.includes("slack") || e.includes("notif")) return <MessageSquare className="h-3.5 w-3.5" />;
  if (e.includes("sent")) return <Send className="h-3.5 w-3.5" />;
  if (e.includes("viewed") || e.includes("opened")) return <Eye className="h-3.5 w-3.5" />;
  if (e.includes("signed")) return <FileSignature className="h-3.5 w-3.5" />;
  if (e.includes("filed") || e.includes("ledger")) return <FileCheck className="h-3.5 w-3.5" />;
  return <Cog className="h-3.5 w-3.5" />;
}

/**
 * Stable taxonomy for the tour. Each row gets a `data-event-kind`
 * attribute the tour can anchor on. Match order matters: more specific
 * patterns come first (e.g. "envelope completed" before "completed").
 */
function kindForEvent(event: string): string {
  const e = event.toLowerCase();
  if (e.includes("filed")) return "filed";
  if (e.includes("envelope completed") || e.includes("connect webhook") || e.includes("signed by")) return "completed";
  if (e.includes("envelope sent") || e.includes("sent via docusign")) return "sent";
  if (e.includes("withdrew") || e.includes("undo")) return "withdrew";
  if (e.includes("approved")) return "approved";
  if (e.includes("slack")) return "notification";
  if (e.includes("routed") || e.includes("awaiting")) return "routed";
  if (e.includes("clause check")) return "clause-check";
  if (e.includes("created")) return "created";
  return "system";
}

export function AuditTrail({ events }: Props) {
  if (events.length === 0) {
    return <div className="text-sm text-ink-500">No audit events yet.</div>;
  }
  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200" />
      <ol className="space-y-3">
        {events.map((e, i) => (
          <li
            key={i}
            className="relative flex gap-3"
            data-event-kind={kindForEvent(e.event)}
          >
            <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500">
              {iconForEvent(e.event)}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="text-[13px] text-ink-900">{e.event}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                <span>{e.actor}</span>
                <span>·</span>
                <span>{formatDateTime(e.at)}</span>
                {e.meta && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{e.meta}</span>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
