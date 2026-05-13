"use client";

import clsx from "clsx";
import { TEMPLATES } from "@/lib/mock-data";
import { RiskBadge } from "./RiskBadge";
import { DocumentTypeIcon } from "./DocumentTypeIcon";
import type { Template } from "@/lib/types";
import { bulletsForTemplate } from "@/lib/template-bullets";
import {
  CATEGORY_ORDER,
  CATEGORY_BLURB,
  CATEGORY_PILL,
  TEMPLATE_CATEGORY,
  recentUpdateInfo,
} from "@/lib/template-meta";
import { ListChecks, Anchor, Check, Sparkles } from "lucide-react";

interface Props {
  selected: Template | null;
  onSelect: (t: Template) => void;
}

/**
 * Step 1 of the new-contract flow.
 *
 * Visual contract: every card-level affordance (DocumentTypeIcon, category pill,
 * RiskBadge, clauseRules + anchors footer) matches the Templates catalog card.
 * Selection state adds a ring + accent border. Click advances the flow.
 */
export function TemplatePicker({ selected, onSelect }: Props) {
  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((category) => {
        const templates = TEMPLATES.filter((t) => TEMPLATE_CATEGORY[t.id] === category);
        if (templates.length === 0) return null;
        return (
          <section key={category}>
            <header className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink-100 pb-1.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-700">{category}</h4>
              <span className="text-[11px] text-ink-500">{CATEGORY_BLURB[category]}</span>
            </header>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {templates.map((t) => {
                const active = selected?.id === t.id;
                const bullets = bulletsForTemplate(t);
                const recency = recentUpdateInfo(t);
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className={clsx(
                      "group flex flex-col rounded-xl border p-4 text-left transition-all",
                      active
                        ? "border-ink-900 bg-white shadow-card ring-1 ring-ink-900/10"
                        : "border-ink-200 bg-white hover:border-ink-300 hover:shadow-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <DocumentTypeIcon type={t.type} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-ink-900">{t.name}</div>
                          <div className="text-[11px] font-mono text-ink-500">{t.version}</div>
                        </div>
                      </div>
                      <span
                        className={clsx(
                          "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset",
                          CATEGORY_PILL[category],
                        )}
                      >
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

                    <div className="mt-auto pt-3">
                      <div className="flex items-center justify-between text-[11px] text-ink-500">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <ListChecks className="h-3 w-3" /> {t.clauseRules.length} rules
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Anchor className="h-3 w-3" /> {t.anchorTags.length} anchors
                          </span>
                        </div>
                        <RiskBadge risk={t.risk} />
                      </div>

                      {active && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-ink-900 px-2 py-0.5 text-[10px] font-medium text-white">
                          <Check className="h-3 w-3" /> Selected
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
