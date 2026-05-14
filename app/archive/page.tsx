"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { KpiStrip } from "@/components/KpiStrip";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentTypeBadge, DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { listContracts } from "@/lib/contract-store";
import { formatDateTime, formatEurCompact, initials } from "@/lib/format";
import { Archive as ArchiveIcon, ChevronRight, FileCheck, Users, Briefcase, Coins, FolderSearch } from "lucide-react";
import type { Contract, DocumentType } from "@/lib/types";

type ArchiveCategory = "all" | "customer" | "people" | "equity";

const TYPE_TO_CATEGORY: Record<DocumentType, Exclude<ArchiveCategory, "all">> = {
  MSA: "customer",
  "Order Form": "customer",
  NDA: "customer",
  Employment: "people",
  Warrant: "equity",
};

const CATEGORY_META: Record<Exclude<ArchiveCategory, "all">, { label: string; blurb: string; icon: typeof Users }> = {
  customer: {
    label: "Customer contracts",
    blurb: "MSAs, Order Forms, NDAs. Ledger journal entry on file.",
    icon: Briefcase,
  },
  people: {
    label: "People",
    blurb: "Employment offers. HRIS record on file.",
    icon: Users,
  },
  equity: {
    label: "Equity",
    blurb: "Warrant agreements. Cap-table grant on file.",
    icon: Coins,
  },
};

const CATEGORY_ORDER: Exclude<ArchiveCategory, "all">[] = ["customer", "people", "equity"];

type Grouping = "category" | "timeline";

/**
 * Bucket signed contracts into time-relative groups for the timeline view.
 * Edge buckets are weeks/months relative to "now"; pre-2025 records fall
 * into the catch-all "Earlier" bucket.
 */
const TIMELINE_BUCKETS: Array<{ id: string; label: string; min: number; max: number }> = [
  { id: "this-week", label: "This week", min: 0, max: 7 },
  { id: "last-week", label: "Last week", min: 7, max: 14 },
  { id: "this-month", label: "This month", min: 14, max: 31 },
  { id: "last-3-months", label: "Last 3 months", min: 31, max: 92 },
  { id: "this-year", label: "This year", min: 92, max: 365 },
  { id: "earlier", label: "Earlier", min: 365, max: Number.POSITIVE_INFINITY },
];

function timelineBucketFor(contract: Contract): typeof TIMELINE_BUCKETS[number] {
  const t = new Date(contract.signedAt ?? contract.updatedAt).getTime();
  const daysAgo = Math.max(0, Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000)));
  return TIMELINE_BUCKETS.find((b) => daysAgo >= b.min && daysAgo < b.max) ?? TIMELINE_BUCKETS[TIMELINE_BUCKETS.length - 1];
}

export default function ArchivePage() {
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [category, setCategory] = useState<ArchiveCategory>("all");
  const [grouping, setGrouping] = useState<Grouping>("category");

  useEffect(() => {
    setContracts(listContracts());
  }, []);

  // Listen for tour effects so the tour can drive the filter chips.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ effect?: string }>).detail;
      switch (detail?.effect) {
        case "archive:filter:all":
          setCategory("all");
          break;
        case "archive:filter:customer":
          setCategory("customer");
          break;
        case "archive:filter:people":
          setCategory("people");
          break;
        case "archive:filter:equity":
          setCategory("equity");
          break;
      }
    };
    window.addEventListener("tour:effect", handler);
    return () => window.removeEventListener("tour:effect", handler);
  }, []);

  const signed = useMemo(
    () =>
      (contracts ?? [])
        .filter((c) => c.stage === "filed" || c.stage === "signed")
        .sort((a, b) => {
          const at = new Date(a.signedAt ?? a.updatedAt).getTime();
          const bt = new Date(b.signedAt ?? b.updatedAt).getTime();
          return bt - at;
        }),
    [contracts],
  );

  const counts = useMemo(() => {
    const c: Record<ArchiveCategory, number> = { all: signed.length, customer: 0, people: 0, equity: 0 };
    for (const s of signed) c[TYPE_TO_CATEGORY[s.type]]++;
    return c;
  }, [signed]);

  const filtered = useMemo(() => {
    if (category === "all") return signed;
    return signed.filter((c) => TYPE_TO_CATEGORY[c.type] === category);
  }, [signed, category]);

  const byEntity = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of signed) {
      if (c.fields.lightEntity) {
        m.set(c.fields.lightEntity, (m.get(c.fields.lightEntity) ?? 0) + 1);
      }
    }
    return m;
  }, [signed]);

  if (contracts === null) {
    return (
      <>
        <Header title="Signed contracts" />
      </>
    );
  }

  return (
    <>
      <Header
        title="Signed contracts"
        subtitle="Past signed contracts."
        breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Signed contracts" }]}
      />
      <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <KpiStrip
          kpis={[
            {
              label: "Total signed",
              value: String(counts.all),
              onClick: () => setCategory("all"),
              active: category === "all",
            },
            {
              label: "Customer contracts",
              value: String(counts.customer),
              hint: "MSAs, Order Forms, NDAs",
              onClick: () => setCategory("customer"),
              active: category === "customer",
            },
            {
              label: "People",
              value: String(counts.people),
              hint: "Employment contracts",
              onClick: () => setCategory("people"),
              active: category === "people",
            },
            {
              label: "Equity",
              value: String(counts.equity),
              hint: "Warrant agreements",
              onClick: () => setCategory("equity"),
              active: category === "equity",
            },
          ]}
        />

        {byEntity.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-ink-50 px-4 py-2 text-[12px] text-ink-500">
            <span className="font-medium text-ink-700">By entity</span>
            <span className="text-ink-300">·</span>
            {Array.from(byEntity.entries()).map(([entity, count]) => (
              <span key={entity} className="inline-flex items-center gap-1.5">
                <span className="text-ink-700">{entity}</span>
                <span className="tabular-nums text-ink-500">{count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Filter chips + group toggle. Mirrors the dashboard's stage tabs and the templates page chips. */}
        <div className="tour-anchor-archive-filters flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-100 bg-white px-2 py-2 sm:px-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "customer", "people", "equity"] as ArchiveCategory[]).map((c) => {
              const label = c === "all" ? "All" : CATEGORY_META[c].label;
              const count = counts[c];
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                    active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100",
                  )}
                  aria-pressed={active}
                >
                  {label}
                  <span className={clsx("tabular-nums", active ? "text-white/70" : "text-ink-400")}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-ink-50 p-0.5 text-[11px]">
            <span className="px-1.5 text-ink-500">Group by</span>
            {(["category", "timeline"] as Grouping[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrouping(g)}
                className={clsx(
                  "rounded-md px-2 py-1 transition-colors",
                  grouping === g ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900",
                )}
                aria-pressed={grouping === g}
              >
                {g === "category" ? "Category" : "Timeline"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FolderSearch className="h-5 w-5" />}
              title="No signed contracts in this category yet"
              description={
                category === "all"
                  ? "Contracts appear here once they reach the Filed stage."
                  : `No ${CATEGORY_META[category as Exclude<ArchiveCategory, "all">].label.toLowerCase()} signed yet. The section appears when one is filed.`
              }
            />
          </Card>
        ) : grouping === "timeline" ? (
          // Timeline view: grouped by signed-at bucket. Within each bucket
          // the rows stay sorted most-recent-first (inherited from `signed`).
          <div className="space-y-4">
            {TIMELINE_BUCKETS.filter((b) => filtered.some((c) => timelineBucketFor(c).id === b.id)).map((bucket) => {
              const rows = filtered.filter((c) => timelineBucketFor(c).id === bucket.id);
              return (
                <section key={bucket.id} className="rounded-xl border border-ink-100 bg-white">
                  <header className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 sm:px-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
                      <ArchiveIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-sm font-semibold text-ink-900">{bucket.label}</h3>
                        <span className="text-[11px] tabular-nums text-ink-500">{rows.length}</span>
                      </div>
                      <div className="text-[11px] text-ink-500">Most recent first.</div>
                    </div>
                  </header>
                  <ul className="divide-y divide-ink-100">
                    {rows.map((c) => (
                      <SignedRow key={c.id} contract={c} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : category === "all" ? (
          // Section view: grouped by category with header + row list each.
          <div className="space-y-4">
            {CATEGORY_ORDER.filter((cat) => signed.some((s) => TYPE_TO_CATEGORY[s.type] === cat)).map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const rows = signed.filter((s) => TYPE_TO_CATEGORY[s.type] === cat);
              return (
                <section key={cat} className="rounded-xl border border-ink-100 bg-white">
                  <header className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 sm:px-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-sm font-semibold text-ink-900">{meta.label}</h3>
                        <span className="text-[11px] tabular-nums text-ink-500">{rows.length}</span>
                      </div>
                      <div className="text-[11px] text-ink-500">{meta.blurb}</div>
                    </div>
                  </header>
                  <ul className="divide-y divide-ink-100">
                    {rows.map((c) => (
                      <SignedRow key={c.id} contract={c} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          // Flat list when a category is selected.
          <Card title={`${CATEGORY_META[category as Exclude<ArchiveCategory, "all">].label}`} subtitle={`${filtered.length} record${filtered.length === 1 ? "" : "s"}, most recent first.`}>
            <ul className="space-y-2">
              {filtered.map((c) => (
                <li key={c.id}>
                  <SignedRow contract={c} />
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
              <ArchiveIcon className="h-4 w-4" />
            </div>
            <div className="text-[12px] text-ink-600">
              <span className="demo-note mr-2">Production note</span>
              ARR booked, headcount, and equity granted live on Light&apos;s main dashboard, not here. This view is for
              retrieval and retention: who signed what, when, against which template version. Also surfaces 7-year
              retention status, deletion holds (for litigation or audit), and re-signed replacements. Each filed PDF is
              stored in the customer&apos;s Drive folder plus our S3 cold storage with WORM (write-once-read-many)
              compliance for finance regulations.
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function SignedRow({ contract: c }: { contract: Contract }) {
  const isHero = c.id === "c_bolt_msa";
  return (
    <Link
      href={`/contracts/${c.id}/signed`}
      className={`group flex items-start gap-3 px-3 py-3 hover:bg-ink-50/60 sm:px-4 ${
        isHero ? "tour-anchor-archive-bolt-row" : ""
      }`}
    >
      <DocumentTypeIcon type={c.type} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-medium text-ink-900">{c.name}</span>
          <DocumentTypeBadge type={c.type} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink-500">
          <span>{c.counterparty}</span>
          {c.valueEur !== undefined && (
            <>
              <span>·</span>
              <span className="font-medium tabular-nums text-ink-700">{formatEurCompact(c.valueEur)}</span>
            </>
          )}
          <span>·</span>
          <span>Signed {formatDateTime(c.signedAt ?? c.updatedAt)}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ink-100 text-[9px] font-semibold text-ink-700">
              {initials(c.owner)}
            </span>
            {c.owner}
          </span>
        </div>
        {c.ledger && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-sage-500">
            <FileCheck className="h-3 w-3" />
            {c.ledger.headline}
          </div>
        )}
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-400 group-hover:text-ink-900" />
    </Link>
  );
}
