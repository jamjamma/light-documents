"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { TemplateCard } from "@/components/TemplateCard";
import { TemplateDetailModal } from "@/components/TemplateDetailModal";
import { RogueTemplatesPanel } from "@/components/RogueTemplatesPanel";
import { TEMPLATES, ROGUE_TEMPLATES, getTemplate } from "@/lib/mock-data";
import { Card } from "@/components/ui/Card";
import type { Template, TemplateId } from "@/lib/types";
import { FileType2, FolderSync, Workflow, Plus, Sparkles } from "lucide-react";
import clsx from "clsx";

const SYNC_META: Record<TemplateId, { fileName: string; syncedAgo: string; variableCount: number; anchorTagCount: number; driveFileId: string }> = {
  nda_v3_1: { fileName: "Mutual-NDA-v3.1.docx", syncedAgo: "2 hours ago", variableCount: 8, anchorTagCount: 4, driveFileId: "1xD8aZ2_kP9mNqR3jL5tBoVc7sYwHfE4u" },
  msa_v4_2: { fileName: "MSA-v4.2.docx", syncedAgo: "yesterday", variableCount: 24, anchorTagCount: 8, driveFileId: "1aBcD3eF4gH5iJ6kL7mN8oP9qR0sT1uVw" },
  msa_pilot_v1_0: { fileName: "MSA-Pilot-v1.0.docx", syncedAgo: "1 week ago", variableCount: 12, anchorTagCount: 5, driveFileId: "1cD4eF6gH8iJ0kL2mN4oP6qR8sT0uV2wX" },
  order_form_v2_0: { fileName: "Order-Form-v2.0.docx", syncedAgo: "yesterday", variableCount: 14, anchorTagCount: 6, driveFileId: "1zY9xW8vU7tS6rQ5pO4nM3lK2jI1hG0fE" },
  employment_dk_v2_0: { fileName: "Employment-DK-v2.0.docx", syncedAgo: "3 days ago", variableCount: 18, anchorTagCount: 6, driveFileId: "1mN2bV4cX6dF8gH0jK2lP4qS6tU8wY0aB" },
  employment_uk_v1_0: { fileName: "Employment-UK-v1.0.docx", syncedAgo: "1 week ago", variableCount: 18, anchorTagCount: 6, driveFileId: "1uK0lM2nO4pQ6rS8tU0vW2xY4zA6bC8dE" },
  warrant_v1_5: { fileName: "Warrant-Agreement-v1.5.docx", syncedAgo: "last week", variableCount: 12, anchorTagCount: 8, driveFileId: "1pQ4rS6tU8vW0xY2zA4bC6dE8fG0hI2jK" },
  warrant_advisor_v1_0: { fileName: "Advisor-Warrant-v1.0.docx", syncedAgo: "2 months ago", variableCount: 9, anchorTagCount: 6, driveFileId: "1aD3eG5hI7jK9lM1nO3pQ5rS7tU9vW1xY" },
};

import {
  TEMPLATE_CATEGORY,
  CATEGORY_BLURB,
  CATEGORY_ORDER,
  CATEGORY_PILL as CATEGORY_ACCENT,
  type Category as TemplateCategory,
  recentUpdateInfo,
} from "@/lib/template-meta";
import { CATEGORY_ICON } from "@/lib/template-meta-icons";

type Category = "all" | TemplateCategory;

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [category, setCategory] = useState<Category>("all");

  const counts = useMemo(() => {
    const m: Record<Category, number> = { all: TEMPLATES.length, "Customer contracts": 0, People: 0, Equity: 0 };
    for (const t of TEMPLATES) m[TEMPLATE_CATEGORY[t.id]]++;
    return m;
  }, []);

  const filtered = useMemo(() => {
    if (category === "all") return TEMPLATES;
    return TEMPLATES.filter((t) => TEMPLATE_CATEGORY[t.id] === category);
  }, [category]);

  const recentlyUpdated = useMemo(
    () => TEMPLATES.map((t) => ({ template: t, info: recentUpdateInfo(t) })).filter((x) => x.info !== null),
    [],
  );

  const tabs: Category[] = ["all", "Customer contracts", "People", "Equity"];

  return (
    <>
      <Header
        title="Templates"
        subtitle="8 master templates synced from Drive."
        actions={
          <Link href="/contracts/new">
            <Button size="sm" leadingIcon={<Plus className="h-3.5 w-3.5" />}>New contract</Button>
          </Link>
        }
      />
      <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-accent-300">
              <Workflow className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink-900">How Word documents connect to this platform</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
                The Legal team
                <span className="text-ink-500"> (illustrated in this demo by Sara Friis as in-house counsel; see About for the full cast)</span>{" "}
                saves Word documents to one canonical folder: <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-900">/Light Documents/Master Templates/</span> in Google Drive. Only Legal and admins have edit access. On every save, the Drive Watch API fires a webhook to our platform. We parse the docx, extract <span className="font-mono text-[12px] text-ink-900">{`{{variables}}`}</span> and
                <span className="font-mono text-[12px] text-ink-900"> {`\\sig:anchor\\`}</span> tags Legal typed directly into Word, and update our cache.
                Templates are <strong>version-pinned at contract create time</strong>, so a master-template edit mid-flow does not disrupt an in-flight contract.
              </p>
              <p className="mt-2 text-[12px] text-ink-600">
                <strong>More people ≠ more templates.</strong> Light has {TEMPLATES.length} master templates today regardless of headcount.
                Template count scales with <em>business complexity</em>, not team size.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-1">
                  <FileType2 className="h-3 w-3" />
                  Source: <span className="font-mono">.docx</span> in Drive / SharePoint
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-1">
                  <FolderSync className="h-3 w-3" />
                  Sync: Drive Watch API
                </span>
              </div>
            </div>
          </div>
        </Card>

        {recentlyUpdated.length > 0 && (
          <div className="rounded-xl border border-sage-500/30 bg-sage-50/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-sage-500" />
              <span className="text-[12px] font-medium text-ink-900">
                {recentlyUpdated.length} template{recentlyUpdated.length === 1 ? "" : "s"} updated in the last 90 days
              </span>
              <span className="text-[11px] text-ink-500">In-flight contracts pinned to older versions stay on those versions; the detail modal shows what changed.</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recentlyUpdated.map(({ template, info }) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50"
                  title={info!.changeNote}
                >
                  <span className="font-medium">{template.name}</span>
                  <span className="font-mono text-[10px] text-ink-500">{template.version}</span>
                  <span className="text-ink-400">·</span>
                  <span className="text-ink-500">{info!.label.replace(/^Updated /, "")}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <RogueTemplatesPanel rogues={ROGUE_TEMPLATES} templateNameById={(id) => getTemplate(id)?.name ?? id} />

        <div className="panel overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-1">
              {tabs.map((c) => {
                const label = c === "all" ? "All" : c;
                const count = counts[c];
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={clsx(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      category === c ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100",
                    )}
                  >
                    {label} <span className={clsx("ml-0.5 tabular-nums", category === c ? "text-white/70" : "text-ink-400")}>{count}</span>
                  </button>
                );
              })}
            </div>
            {category !== "all" && (
              <div className="text-[11px] text-ink-500">{CATEGORY_BLURB[category]}</div>
            )}
          </header>

          {category === "all" ? (
            // Section view: group by category with header + responsive grid each.
            <div className="space-y-1 p-3 sm:p-4">
              {CATEGORY_ORDER.map((cat) => {
                const groupTemplates = TEMPLATES.filter((t) => TEMPLATE_CATEGORY[t.id] === cat);
                if (groupTemplates.length === 0) return null;
                return (
                  <section key={cat} className="rounded-xl">
                    <header className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 pt-2">
                      <div className="flex items-center gap-2">
                        <span className={clsx("inline-flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-inset", CATEGORY_ACCENT[cat])}>
                          {CATEGORY_ICON[cat]}
                        </span>
                        <div>
                          <div className="text-[13px] font-semibold text-ink-900">
                            {cat} <span className="ml-1 text-ink-500 tabular-nums">({groupTemplates.length})</span>
                          </div>
                          <div className="text-[11px] text-ink-500">{CATEGORY_BLURB[cat]}</div>
                        </div>
                      </div>
                    </header>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {groupTemplates.map((template) => {
                        const meta = SYNC_META[template.id];
                        return (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            sourceFileName={meta.fileName}
                            syncedAgo={meta.syncedAgo}
                            variableCount={meta.variableCount}
                            anchorTagCount={meta.anchorTagCount}
                            onClick={() => setSelectedTemplate(template)}
                            hideCategoryPill
                          />
                        );
                      })}
                    </div>
                    <div className="my-4 h-px bg-ink-100 last:hidden" />
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((template) => {
                const meta = SYNC_META[template.id];
                return (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    sourceFileName={meta.fileName}
                    syncedAgo={meta.syncedAgo}
                    variableCount={meta.variableCount}
                    anchorTagCount={meta.anchorTagCount}
                    onClick={() => setSelectedTemplate(template)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <TemplateDetailModal
          open={selectedTemplate !== null}
          onClose={() => setSelectedTemplate(null)}
          template={selectedTemplate}
          sourceFileName={selectedTemplate ? SYNC_META[selectedTemplate.id]?.fileName : undefined}
          syncedAgo={selectedTemplate ? SYNC_META[selectedTemplate.id]?.syncedAgo : undefined}
          driveFileId={selectedTemplate ? SYNC_META[selectedTemplate.id]?.driveFileId : undefined}
          variableCount={selectedTemplate ? SYNC_META[selectedTemplate.id]?.variableCount : undefined}
          anchorTagCount={selectedTemplate ? SYNC_META[selectedTemplate.id]?.anchorTagCount : undefined}
        />
      </div>
    </>
  );
}
