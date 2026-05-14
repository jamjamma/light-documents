"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { Modal } from "./ui/Modal";
import { Badge } from "./ui/Badge";
import { RiskBadge } from "./RiskBadge";
import { DocumentTypeIcon } from "./DocumentTypeIcon";
import type { Template, TemplateVersion } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { recentUpdateInfo } from "@/lib/template-meta";
import {
  FileType2,
  Check,
  AlertTriangle,
  OctagonAlert,
  History,
  ChevronDown,
  Workflow,
  ShieldCheck,
  Mail,
  Eye,
  Plus,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

interface Props {
  open: boolean;
  onClose: () => void;
  template: Template | null;
  sourceFileName?: string;
  syncedAgo?: string;
  driveFileId?: string;
  variableCount?: number;
  anchorTagCount?: number;
}

const SEVERITY_ICON = {
  info: <Check className="h-3.5 w-3.5 text-ink-400" />,
  warn: <AlertTriangle className="h-3.5 w-3.5 text-accent-500" />,
  block: <OctagonAlert className="h-3.5 w-3.5 text-rose-500" />,
};

export function TemplateDetailModal({
  open,
  onClose,
  template,
  sourceFileName,
  syncedAgo,
  driveFileId,
  variableCount,
  anchorTagCount,
}: Props) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  if (!template) return null;

  const history = template.versionHistory ?? [];
  const current = history.find((v) => v.status === "current");
  const recency = recentUpdateInfo(template);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex flex-wrap items-center gap-2.5">
          <DocumentTypeIcon type={template.type} size="sm" />
          <span>{template.name}</span>
          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-mono text-ink-600">{template.version}</span>
          <RiskBadge risk={template.risk} />
        </div>
      }
      subtitle={template.description}
      headerActions={
        <Link
          href={`/contracts/new?template=${encodeURIComponent(template.id)}`}
          className="inline-flex items-center gap-1 rounded-md bg-ink-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-ink-800"
          onClick={onClose}
        >
          <Plus className="h-3 w-3" />
          New contract
        </Link>
      }
    >
      <div className="space-y-5">
        {recency && (
          <div className={clsx("flex items-start gap-3 rounded-lg px-4 py-3 text-[12px] ring-1 ring-inset", recency.classes)}>
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">{recency.label} · {current?.version}</div>
              <div className="mt-0.5 text-[11.5px] opacity-90">{recency.changeNote}</div>
            </div>
          </div>
        )}

        {/* Source + sync metadata */}
        {sourceFileName && (
          <section className="tour-anchor-template-source">
            <div className="demo-note mb-2">Source file</div>
            <div className="flex items-start gap-3 rounded-lg border border-ink-100 bg-ink-50/40 p-3">
              <FileType2 className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[12px] font-medium text-ink-900">{sourceFileName}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">
                  Synced {syncedAgo} via Drive Watch API
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-ink-500">
                  {variableCount !== undefined && <span>{variableCount} variables parsed</span>}
                  {anchorTagCount !== undefined && <span>{anchorTagCount} anchor tags</span>}
                </div>
                {driveFileId && (
                  <div className="mt-1 truncate font-mono text-[10px] text-ink-400" title={driveFileId}>
                    fileId: {driveFileId}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Ownership + access */}
        <section className="tour-anchor-template-ownership">
          <div className="demo-note mb-2">Ownership + access</div>
          <div className="grid gap-3 text-[12px] sm:grid-cols-2">
            <div className="rounded-lg border border-ink-100 bg-white p-3">
              <div className="text-ink-500">Owner team</div>
              <div className="mt-0.5 font-medium text-ink-900">{template.ownerTeam}</div>
            </div>
            {current && (
              <div className="rounded-lg border border-ink-100 bg-white p-3">
                <div className="text-ink-500">Maintained by</div>
                <div className="mt-0.5 font-medium text-ink-900">{current.author}</div>
              </div>
            )}
            <div className="rounded-lg border border-ink-100 bg-white p-3">
              <div className="text-ink-500">Document type</div>
              <div className="mt-0.5 font-medium text-ink-900">{template.type}</div>
            </div>
            <div className="rounded-lg border border-ink-100 bg-white p-3">
              <div className="text-ink-500">Jurisdictions</div>
              <div className="mt-0.5 text-ink-800">{template.jurisdictions.join(", ")}</div>
            </div>
            <div className="rounded-lg border border-ink-100 bg-white p-3 sm:col-span-2">
              <div className="text-ink-500">Edit access (Drive folder ACL)</div>
              <div className="mt-0.5 text-ink-700">Legal + admins only. Everyone else read-only via this app.</div>
            </div>
          </div>
        </section>

        {/* Clause rules */}
        <section className="tour-anchor-template-clauserules">
          <div className="demo-note mb-2 flex items-center gap-2">
            <Workflow className="h-3 w-3" />
            Clause rules ({template.clauseRules.length})
          </div>

          {/* Mobile: stacked cards (table cells wrap one word per line at this width) */}
          <ul className="space-y-2 sm:hidden">
            {template.clauseRules.map((rule) => (
              <li key={rule.key} className="rounded-lg border border-ink-100 bg-white p-3 text-[12px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-ink-900">{rule.label}</div>
                  <span className="inline-flex shrink-0 items-center gap-1.5">
                    {SEVERITY_ICON[rule.severity]}
                    <span className="capitalize text-ink-600">{rule.severity}</span>
                  </span>
                </div>
                <div className="mt-1 text-ink-700">
                  <span className="demo-note mr-1 normal-case">Expected:</span>
                  {rule.expected}
                </div>
                <div className="mt-1 text-ink-500">{rule.reason}</div>
              </li>
            ))}
          </ul>

          {/* Desktop / tablet: table */}
          <div className="hidden overflow-hidden rounded-lg border border-ink-100 sm:block">
            <table className="text-[12px]">
              <thead className="bg-ink-50/60">
                <tr>
                  <th className="px-3 py-2">Clause</th>
                  <th className="px-3 py-2">Expected (master)</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {template.clauseRules.map((rule) => (
                  <tr key={rule.key}>
                    <td className="px-3 py-2 font-medium text-ink-900">{rule.label}</td>
                    <td className="px-3 py-2 text-ink-700">{rule.expected}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        {SEVERITY_ICON[rule.severity]}
                        <span className="capitalize text-ink-600">{rule.severity}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink-500">{rule.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Conditional sections */}
        {template.conditionalSections.length > 0 && (
          <section>
            <div className="demo-note mb-2">Conditional sections</div>
            <ul className="space-y-2 text-[12px]">
              {template.conditionalSections.map((s) => (
                <li key={s.id} className="rounded-lg border border-ink-100 bg-white p-3">
                  <div className="font-medium text-ink-900">{s.label}</div>
                  <div className="mt-0.5 text-ink-600">{s.description}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* DocuSign features */}
        <section className="tour-anchor-template-features">
          <div className="demo-note mb-2">DocuSign features per envelope</div>
          <div className="grid gap-2 text-[12px] sm:grid-cols-2">
            <FeatureRow on={!!template.docusignFeatures.qesRequired} icon={<ShieldCheck className="h-3.5 w-3.5" />} label="eIDAS QES identity verification" />
            <FeatureRow on={!!template.docusignFeatures.smsVerification} icon={<Mail className="h-3.5 w-3.5" />} label="SMS / phone OTP" />
            <FeatureRow on={!!template.docusignFeatures.witnessRequired} icon={<Eye className="h-3.5 w-3.5" />} label="Witness signer" />
            <FeatureRow on={!!template.docusignFeatures.powerFormCapable} label="PowerForm self-serve" />
            <FeatureRow on={!!template.docusignFeatures.bulkSendCapable} label="Bulk Send" />
            <FeatureRow on={true} label={`${template.docusignFeatures.signingOrder ?? "sequential"} signing`} />
            <FeatureRow on={true} label={`${template.docusignFeatures.expiryDays ?? 14}-day expiry`} />
            <FeatureRow on={true} label={`Reminders day ${template.docusignFeatures.reminderDays?.join(", ") ?? "3, 7"}`} />
          </div>
        </section>

        {/* Anchor tags */}
        <section className="tour-anchor-template-anchors">
          <div className="demo-note mb-2">Anchor tags the Legal team embedded in the master template</div>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-accent-200 bg-accent-50 p-3">
            {template.anchorTags.map((tag) => (
              <span key={tag} className="rounded bg-white px-2 py-0.5 font-mono text-[11px] text-accent-700 ring-1 ring-inset ring-accent-200">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Version history */}
        {history.length > 0 && (
          <section className="tour-anchor-template-versions">
            <div className="demo-note mb-2 flex items-center gap-2">
              <History className="h-3 w-3" />
              Version history ({history.length})
            </div>
            <ol className="space-y-2">
              {history.map((v) => (
                <VersionRow
                  key={v.version}
                  version={v}
                  expanded={expandedVersion === v.version}
                  onToggle={() => setExpandedVersion(expandedVersion === v.version ? null : v.version)}
                />
              ))}
            </ol>
          </section>
        )}
      </div>
    </Modal>
  );
}

function FeatureRow({ on, icon, label }: { on: boolean; icon?: React.ReactNode; label: string }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        on ? "border-sage-500/30 bg-sage-50/40 text-ink-800" : "border-ink-100 bg-ink-50/30 text-ink-400",
      )}
    >
      <span className={on ? "text-sage-500" : "text-ink-300"}>{on ? <Check className="h-3.5 w-3.5" /> : icon ?? <span className="h-3.5 w-3.5" />}</span>
      <span>{label}</span>
    </div>
  );
}

function VersionRow({
  version,
  expanded,
  onToggle,
}: {
  version: TemplateVersion;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tone = version.status === "current" ? "sage" : version.status === "deprecated" ? "amber" : "slate";
  return (
    <li
      className={clsx(
        "overflow-hidden rounded-lg border",
        version.status === "current" ? "border-sage-500/30 bg-sage-50/30" : "border-ink-200 bg-white",
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-ink-50/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] font-semibold text-ink-900">{version.version}</span>
            <Badge tone={tone}>{version.status}</Badge>
            <span className="text-[11px] text-ink-500">released {formatDate(version.releasedAt)}</span>
            {version.deprecatedAt && (
              <span className="text-[11px] text-ink-500">· deprecated {formatDate(version.deprecatedAt)}</span>
            )}
          </div>
          <div className="mt-0.5 line-clamp-1 text-[12px] text-ink-700">{version.changeNote}</div>
        </div>
        <ChevronDown className={clsx("mt-0.5 h-4 w-4 shrink-0 text-ink-400 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="border-t border-ink-100 bg-white px-3 py-3 text-[12px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="demo-note mb-1">Change note</div>
              <div className="text-ink-700">{version.changeNote}</div>
            </div>
            <div>
              <div className="demo-note mb-1">Author</div>
              <div className="text-ink-700">{version.author}</div>
              <div className="mt-2 demo-note mb-1">Lifecycle</div>
              <div className="text-ink-700">Released {formatDate(version.releasedAt)}</div>
              {version.deprecatedAt && <div className="text-ink-500">Deprecated {formatDate(version.deprecatedAt)}</div>}
              {version.status === "current" && <div className="text-sage-500">Active (used for all new contracts)</div>}
              {version.status === "archived" && <div className="text-ink-500">Archived (read-only; only existing contracts still reference)</div>}
            </div>
          </div>
          <div className="mt-3 rounded-md bg-ink-50/60 px-3 py-2 text-[11px] text-ink-500">
            <span className="demo-note mr-1">Demo</span>
            Production: clicking a historical version opens the actual docx as it was when superseded, with a diff against the current. We log every clause-level change so legal can answer "which terms applied when Acme signed?".
          </div>
        </div>
      )}
    </li>
  );
}
