"use client";

import { useEffect, useState } from "react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import type { RogueTemplate, TemplateId } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { readTourState, TOUR_STEPS } from "@/lib/tour-steps";
import {
  AlertTriangle,
  Archive as ArchiveIcon,
  BellRing,
  Check,
  ChevronDown,
  FileWarning,
  MessageSquare,
  Send,
  Undo2,
} from "lucide-react";
import clsx from "clsx";
import {
  archiveRogue,
  getRogueAction,
  notifyRogueOwner,
  undoArchiveRogue,
  undoNotifyRogue,
  type RogueAction,
} from "@/lib/contract-store";

interface Props {
  rogues: RogueTemplate[];
  templateNameById: (id: TemplateId) => string;
}

// Operator persona who appears as the actor on archive / notify events.
// Matches Sidebar's logged-in identity (Head of Finance & Ops). Production
// resolves this from the SSO session.
const OPERATOR_NAME = "Martina Holst";

export function RogueTemplatesPanel({ rogues, templateNameById }: Props) {
  const [open, setOpen] = useState(false);

  // When the user opens the panel during the `templates-rogue-expand` tour
  // step, auto-advance the tour. This mirrors the modal-open pattern: the
  // user takes the in-app action, the tour follows. Guarded by fromStepId
  // so opening/closing the panel later doesn't unexpectedly advance.
  useEffect(() => {
    if (!open) return;
    const state = readTourState();
    if (!state.active) return;
    const step = TOUR_STEPS[state.stepIndex];
    if (step?.id !== "templates-rogue-expand") return;
    window.dispatchEvent(
      new CustomEvent("tour:auto-next", {
        detail: { fromStepId: "templates-rogue-expand" },
      }),
    );
  }, [open]);

  if (rogues.length === 0) return null;

  return (
    <Card className="border-rose-500/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tour-anchor-rogue-header -m-5 flex w-[calc(100%+2.5rem)] items-start gap-3 px-5 py-4 text-left hover:bg-rose-50/30"
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
          className={clsx(
            "tour-anchor-rogue-chevron mt-1 h-4 w-4 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-4 -mx-5 -mb-5 space-y-2 border-t border-ink-100 bg-ink-50/30 px-5 py-4">
          {rogues.map((r, i) => (
            <RogueRow
              key={r.driveFileId}
              rogue={r}
              templateName={templateNameById(r.matchesTemplate)}
              isFirst={i === 0}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Notify routing ───────────────────────────────────────────────────────────
// Who Slack DMs when "Notify owner" is clicked.

interface NotifyTarget {
  channel: "slack_dm" | "slack_channel";
  recipient: string;
  rationale: string;
}

function resolveNotifyTarget(rogue: RogueTemplate): NotifyTarget {
  const lastUser = rogue.lastUsedBy ?? "";
  const leftCompany = /left company|left in|departed/i.test(lastUser);
  // Strip role parenthetical for display: "Sara Lindberg (Sales)" → "Sara Lindberg"
  const cleanName = lastUser.replace(/\s*\(.*?\)\s*$/, "").trim();
  if (lastUser && !leftCompany) {
    return {
      channel: "slack_dm",
      recipient: cleanName,
      rationale: `${cleanName} is the most recent person to touch this file.`,
    };
  }
  if (leftCompany) {
    return {
      channel: "slack_channel",
      recipient: "#sales-ops",
      rationale: `${cleanName.split(" ")[0] || "Original owner"} left the company; route to the team channel so the current lead picks it up.`,
    };
  }
  return {
    channel: "slack_channel",
    recipient: "#legal-rogue-templates",
    rationale: "No recent user on this file; route to the triage channel.",
  };
}

// Build the Slack-style DM that would go out. Tailored per rogue so the
// recipient sees the file name, similarity, the diff, and the recommended
// next action. Pure function so it's easy to preview in the UI.
function buildSlackMessage(rogue: RogueTemplate, target: NotifyTarget, templateName: string): string {
  const intro = target.channel === "slack_dm"
    ? `Hey ${target.recipient.split(" ")[0]}, quick heads-up.`
    : `Heads-up team.`;
  const pct = Math.round(rogue.similarity * 100);
  return [
    `${intro} Our daily Drive scan flagged \`${rogue.fileName}\` as a *rogue template* (${pct}% match to *${templateName}*).`,
    ``,
    `*What's off:* ${rogue.diffSummary}`,
    ``,
    `*Recommended:* ${rogue.recommendedAction}`,
    ``,
    `For new deals please use the master template in Light Documents so clause checks, approval routing, and ledger writeback all fire automatically. Reply to this thread if you need help routing an existing draft, happy to walk through it.`,
    ``,
    `${OPERATOR_NAME} (Head of Finance & Ops)`,
  ].join("\n");
}

// ── Row ──────────────────────────────────────────────────────────────────────

function RogueRow({
  rogue,
  templateName,
  isFirst = false,
}: {
  rogue: RogueTemplate;
  templateName: string;
  /** Only the first row carries the tour anchor for the action buttons. */
  isFirst?: boolean;
}) {
  const similarityPct = Math.round(rogue.similarity * 100);
  const target = resolveNotifyTarget(rogue);

  const [action, setAction] = useState<RogueAction>({});
  const [showSlackPreview, setShowSlackPreview] = useState(false);

  // Hydrate persisted action from localStorage after mount (SSR-safe).
  useEffect(() => {
    setAction(getRogueAction(rogue.driveFileId));
  }, [rogue.driveFileId]);

  // Auto-advance the tour when the user clicks Notify on the FIRST row
  // during the matching tour step. The next step anchors on the just-
  // opened Slack DM preview. Guarded by isFirst (only the first row
  // carries the tour anchors) + fromStepId.
  useEffect(() => {
    if (!isFirst || !showSlackPreview) return;
    const state = readTourState();
    if (!state.active) return;
    const step = TOUR_STEPS[state.stepIndex];
    if (step?.id !== "templates-rogue-notify") return;
    window.dispatchEvent(
      new CustomEvent("tour:auto-next", {
        detail: { fromStepId: "templates-rogue-notify" },
      }),
    );
  }, [showSlackPreview, isFirst]);

  // Auto-advance when the user clicks Archive on the first row during the
  // archive walk step. The next tour step anchors on the archived-stamp.
  useEffect(() => {
    if (!isFirst || !action.archived) return;
    const state = readTourState();
    if (!state.active) return;
    const step = TOUR_STEPS[state.stepIndex];
    if (step?.id !== "templates-rogue-archive") return;
    window.dispatchEvent(
      new CustomEvent("tour:auto-next", {
        detail: { fromStepId: "templates-rogue-archive" },
      }),
    );
  }, [action.archived, isFirst]);

  const onArchive = () => {
    setAction(archiveRogue(rogue.driveFileId, OPERATOR_NAME));
  };
  const onUndoArchive = () => {
    setAction(undoArchiveRogue(rogue.driveFileId));
  };
  const onOpenNotify = () => setShowSlackPreview(true);
  const onSendDm = () => {
    setAction(
      notifyRogueOwner({
        driveFileId: rogue.driveFileId,
        byUserName: OPERATOR_NAME,
        channel: target.channel,
        recipient: target.recipient,
      }),
    );
    setShowSlackPreview(false);
  };
  const onUndoNotify = () => {
    setAction(undoNotifyRogue(rogue.driveFileId));
  };

  const isArchived = !!action.archived;

  return (
    <div
      className={clsx(
        "rounded-lg border p-3 transition-opacity",
        isArchived ? "border-ink-200 bg-ink-50/60 opacity-70" : "border-ink-200 bg-white",
        isFirst && "tour-anchor-rogue-row",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isArchived ? "bg-ink-100 text-ink-500" : "bg-rose-50 text-rose-500",
          )}
        >
          {isArchived ? <ArchiveIcon className="h-3.5 w-3.5" /> : <FileWarning className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] font-medium text-ink-900">{rogue.fileName}</span>
            {isArchived ? (
              <Badge tone="slate">archived</Badge>
            ) : (
              <Badge tone="rose">rogue</Badge>
            )}
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

          {/* Action-result stamps */}
          {(action.archived || action.notified) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              {action.archived && (
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-ink-700",
                    isFirst && "tour-anchor-rogue-archived-stamp",
                  )}
                >
                  <Check className="h-3 w-3" />
                  Archived by {action.archived.by} · {formatDateTime(action.archived.at)}
                  <button
                    type="button"
                    onClick={onUndoArchive}
                    className={clsx(
                      "ml-1 inline-flex items-center gap-0.5 text-ink-500 hover:text-ink-900",
                      isFirst && "tour-anchor-rogue-undo",
                    )}
                  >
                    <Undo2 className="h-3 w-3" /> Undo
                  </button>
                </span>
              )}
              {action.notified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5 text-sage-500 ring-1 ring-inset ring-sage-500/20">
                  <Check className="h-3 w-3" />
                  {action.notified.channel === "slack_dm" ? "Slack DM" : "Slack channel"} sent to{" "}
                  <span className="font-medium">{action.notified.recipient}</span> · {formatDateTime(action.notified.at)}
                  <button
                    type="button"
                    onClick={onUndoNotify}
                    className="ml-1 inline-flex items-center gap-0.5 text-sage-500/80 hover:text-sage-500"
                  >
                    <Undo2 className="h-3 w-3" /> Undo
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Slack DM preview (expands when Notify clicked, collapses after Send) */}
          {showSlackPreview && (
            <div className={clsx(isFirst && "tour-anchor-rogue-slack-preview")}>
              <SlackDmPreview
                target={target}
                message={buildSlackMessage(rogue, target, templateName)}
                onSend={onSendDm}
                onCancel={() => setShowSlackPreview(false)}
              />
            </div>
          )}
        </div>

        {/* Action buttons (right column on desktop, wraps under content on narrow) */}
        <div
          className={clsx(
            "flex shrink-0 flex-col gap-1.5",
            isFirst && "tour-anchor-rogue-actions",
          )}
        >
          {!isArchived && (
            <Button variant="secondary" size="sm" leadingIcon={<ArchiveIcon className="h-3.5 w-3.5" />} onClick={onArchive}>
              Archive
            </Button>
          )}
          {!action.notified && !showSlackPreview && (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<BellRing className="h-3.5 w-3.5" />}
              onClick={onOpenNotify}
              title={`Open Slack DM preview for ${target.recipient}`}
            >
              Notify owner
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Slack DM preview ─────────────────────────────────────────────────────────

function SlackDmPreview({
  target,
  message,
  onSend,
  onCancel,
}: {
  target: NotifyTarget;
  message: string;
  onSend: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 bg-ink-50/60 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-ink-700">
          <MessageSquare className="h-3.5 w-3.5 text-ink-500" />
          <span className="font-medium">
            {target.channel === "slack_dm" ? "Slack DM to" : "Slack post to"}
          </span>
          <span className="truncate font-mono text-ink-900">{target.recipient}</span>
        </div>
        <span className="demo-note shrink-0">Preview</span>
      </div>

      <div className="px-3 py-2.5">
        <div className="text-[11px] text-ink-500">
          <strong className="font-medium text-ink-700">Why this recipient:</strong> {target.rationale}
        </div>
        <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-ink-50 px-3 py-2 text-[12px] leading-relaxed text-ink-800">
{message}
        </pre>

        <div className="mt-2 rounded-md bg-ink-50/60 px-2.5 py-1.5 text-[11px] text-ink-600">
          <span className="demo-note mr-1">In production</span>
          We post via Slack Web API <span className="font-mono">chat.postMessage</span> with interactive
          buttons (Acknowledge / Reroute to master / Snooze 7d). Replies thread back into our audit log so
          the rogue file's resolution is on the record.
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" leadingIcon={<Send className="h-3.5 w-3.5" />} onClick={onSend}>
            Send {target.channel === "slack_dm" ? "DM" : "post"}
          </Button>
        </div>
      </div>
    </div>
  );
}
