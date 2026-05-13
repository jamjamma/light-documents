"use client";

import { useState } from "react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import type { RogueTemplate, TemplateId } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { AlertTriangle, ChevronDown, FileWarning } from "lucide-react";
import clsx from "clsx";

interface Props {
  rogues: RogueTemplate[];
  templateNameById: (id: TemplateId) => string;
}

export function RogueTemplatesPanel({ rogues, templateNameById }: Props) {
  const [open, setOpen] = useState(false);

  if (rogues.length === 0) return null;

  return (
    <Card className="border-rose-500/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="-m-5 flex w-[calc(100%+2.5rem)] items-start gap-3 px-5 py-4 text-left hover:bg-rose-50/30"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-500/30">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink-900">
              Rogue templates detected in Drive
            </h3>
            <Badge tone="rose">{rogues.length}</Badge>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
            Daily scan found {rogues.length} document{rogues.length === 1 ? "" : "s"} outside the canonical <span className="rounded bg-rose-50 px-1 py-0.5 font-mono text-[11px] text-rose-600">/Master Templates/</span> folder that look like master templates but are not. Each one is a future contract waiting to use the wrong terms.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
            <span><strong className="text-ink-700">Owned by:</strong> Head of Finance & Operations</span>
            <span>·</span>
            <span><strong className="text-ink-700">Scan cadence:</strong> daily at 02:00 UTC</span>
            <span>·</span>
            <span><strong className="text-ink-700">Triage cadence:</strong> weekly digest, Monday 09:00</span>
            <span>·</span>
            <span><strong className="text-ink-700">Last scan:</strong> 2 hours ago</span>
          </div>
        </div>
        <ChevronDown
          className={clsx("mt-1 h-4 w-4 shrink-0 text-ink-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-4 -mx-5 -mb-5 space-y-2 border-t border-ink-100 bg-ink-50/30 px-5 py-4">
          {rogues.map((r) => (
            <RogueRow key={r.driveFileId} rogue={r} templateName={templateNameById(r.matchesTemplate)} />
          ))}
        </div>
      )}
    </Card>
  );
}

function RogueRow({ rogue, templateName }: { rogue: RogueTemplate; templateName: string }) {
  const similarityPct = Math.round(rogue.similarity * 100);
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
          <FileWarning className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] font-medium text-ink-900">{rogue.fileName}</span>
            <Badge tone="rose">rogue</Badge>
            <span className="text-[11px] text-ink-500">
              {similarityPct}% match to <span className="font-medium text-ink-700">{templateName}</span>
            </span>
          </div>
          <div className="mt-1 text-[12px] text-ink-600">{rogue.diffSummary}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
            <span>Detected {formatDateTime(rogue.detectedAt)}</span>
            {rogue.lastUsedBy && (
              <>
                <span>·</span>
                <span>Last used by {rogue.lastUsedBy}</span>
              </>
            )}
            {rogue.lastUsedAt && (
              <>
                <span>·</span>
                <span>{formatDateTime(rogue.lastUsedAt)}</span>
              </>
            )}
          </div>
          <div className="mt-2 rounded-md bg-accent-50 px-2.5 py-1.5 text-[11px] text-accent-800 ring-1 ring-inset ring-accent-200">
            <strong>Recommended:</strong> {rogue.recommendedAction}
          </div>
          <div className="mt-1 truncate font-mono text-[10px] text-ink-400" title={rogue.driveFileId}>
            fileId: {rogue.driveFileId.slice(0, 18)}…
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Button variant="secondary" size="sm">Archive</Button>
          <Button variant="ghost" size="sm">Notify owner</Button>
        </div>
      </div>
    </div>
  );
}
