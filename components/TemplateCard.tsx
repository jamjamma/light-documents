"use client";

import Link from "next/link";
import { RiskBadge } from "./RiskBadge";
import { DocumentTypeIcon } from "./DocumentTypeIcon";
import type { Template } from "@/lib/types";
import { bulletsForTemplate } from "@/lib/template-bullets";
import {
  CATEGORY_PILL,
  TEMPLATE_CATEGORY,
  recentUpdateInfo,
} from "@/lib/template-meta";
import { FileType2, ChevronRight, Anchor, ListChecks, Plus, Sparkles } from "lucide-react";
import clsx from "clsx";

interface Props {
  template: Template;
  sourceFileName: string;
  syncedAgo: string;
  variableCount: number;
  anchorTagCount: number;
  onClick: () => void;
}

export function TemplateCard({ template, sourceFileName, syncedAgo, anchorTagCount, onClick }: Props) {
  const history = template.versionHistory ?? [];
  const currentAuthor = history.find((v) => v.status === "current")?.author;
  const bullets = bulletsForTemplate(template);
  const category = TEMPLATE_CATEGORY[template.id];
  const recency = recentUpdateInfo(template);

  const useHref = `/contracts/new?template=${encodeURIComponent(template.id)}`;
  return (
    <div className="group flex w-full flex-col rounded-xl border border-ink-200 bg-white p-4 transition-all hover:border-ink-300 hover:shadow-card">
      <button
        type="button"
        onClick={onClick}
        aria-label={`View details for ${template.name}`}
        className="flex flex-1 flex-col text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <DocumentTypeIcon type={template.type} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink-900">{template.name}</div>
              <div className="text-[11px] font-mono text-ink-500">{template.version}</div>
            </div>
          </div>
          <span className={clsx("inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset", CATEGORY_PILL[category])}>
            {category}
          </span>
        </div>

        {recency && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                recency.classes,
              )}
              title={recency.changeNote}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {recency.label}
            </span>
          </div>
        )}

        <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-ink-700">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-ink-400"></span>
              <span className="flex items-center gap-1">
                {b.icon}
                {b.text}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center justify-between text-[11px] text-ink-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3 w-3" /> {template.clauseRules.length} rules
            </span>
            <span className="inline-flex items-center gap-1">
              <Anchor className="h-3 w-3" /> {anchorTagCount} anchors
            </span>
          </div>
          <RiskBadge risk={template.risk} />
        </div>

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-ink-100 pt-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate text-[11px] text-ink-600">
              <FileType2 className="h-3 w-3 shrink-0 text-ink-400" />
              <span className="truncate font-mono">{sourceFileName}</span>
            </div>
            <div className="mt-0.5 truncate text-[10px] text-ink-400">
              Synced {syncedAgo}{currentAuthor ? ` · maintained by ${currentAuthor.split(" (")[0]}` : ""}
            </div>
          </div>
          <div className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-ink-500 group-hover:text-ink-700">
            View details
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </button>

      <Link
        href={useHref}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
      >
        <Plus className="h-3.5 w-3.5" />
        Use this template
      </Link>
    </div>
  );
}
