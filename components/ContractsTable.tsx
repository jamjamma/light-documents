"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Contract, DocumentType, Stage } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { DocumentTypeIcon, DocumentTypeBadge } from "./DocumentTypeIcon";
import { formatEurCompact, relativeDays, initials } from "@/lib/format";
import { ChevronRight, FileText, ArrowUp, ArrowDown, ArrowUpDown, Clock } from "lucide-react";
import { EmptyState } from "./ui/EmptyState";
import { stageAgeDays } from "@/lib/contract-store";

type Filter = "all" | "awaiting_me" | "blocked" | "in_review";

type SortField = "name" | "type" | "counterparty" | "valueEur" | "stage" | "owner" | "updatedAt";
type SortDir = "asc" | "desc";

const STAGE_ORDER: Record<Stage, number> = {
  draft: 0,
  needs_info: 1,
  checks_running: 2,
  in_review: 3,
  awaiting_approval: 4,
  ready_to_send: 5,
  sent: 6,
  signed: 7,
  filed: 8,
};

interface Props {
  contracts: Contract[];
  filter: Filter;
  onFilterChange: (f: Filter) => void;
  awaitingRole?: string;
}

const DOC_TYPE_ORDER: DocumentType[] = ["MSA", "Order Form", "NDA", "Employment", "Warrant"];

const FILTERS: { id: Filter; label: string; tooltip?: string }[] = [
  { id: "all", label: "All in-flight" },
  { id: "awaiting_me", label: "Awaiting me", tooltip: "Contracts where the current user has a pending approval. Demo: simulating Martina (Head of F&O). Production: pulled from SSO logged-in user." },
  { id: "blocked", label: "Blocked" },
  { id: "in_review", label: "In review" },
];

export function ContractsTable({ contracts, filter, onFilterChange, awaitingRole = "Head of Finance & Ops" }: Props) {
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: "updatedAt", dir: "desc" });
  const [typeFilter, setTypeFilter] = useState<DocumentType | null>(null);
  const stageFiltered = useMemo(() => applyFilter(contracts, filter, awaitingRole), [contracts, filter, awaitingRole]);
  const filtered = useMemo(
    () => (typeFilter ? stageFiltered.filter((c) => c.type === typeFilter) : stageFiltered),
    [stageFiltered, typeFilter],
  );
  const sorted = useMemo(() => sortContracts(filtered, sort), [filtered, sort]);

  // Type counts compute from the stage-filtered set so chips show "how many MSAs are in the current view"
  const typeCounts = useMemo(() => {
    const m = new Map<DocumentType, number>();
    for (const c of stageFiltered) m.set(c.type, (m.get(c.type) ?? 0) + 1);
    return m;
  }, [stageFiltered]);

  const toggleSort = (field: SortField) => {
    setSort((prev) => {
      if (prev.field === field) return { field, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { field, dir: field === "valueEur" || field === "updatedAt" ? "desc" : "asc" };
    });
  };

  return (
    <section className="panel overflow-hidden">
      <header className="tour-anchor-table-filters flex flex-col gap-2 border-b border-ink-100 px-4 py-3 sm:px-5">
        {/* Stage filter tabs + count summary */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                title={f.tooltip}
                className={clsx(
                  "shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === f.id ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-ink-500">{sorted.length} of {contracts.length} contracts</div>
        </div>

        {/* Type filter chips (replaces the old "Mix:" legend row) */}
        <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pt-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setTypeFilter(null)}
            className={clsx(
              "shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              typeFilter === null ? "bg-ink-100 text-ink-900 ring-1 ring-inset ring-ink-200" : "text-ink-500 hover:bg-ink-50",
            )}
          >
            All types
          </button>
          {DOC_TYPE_ORDER.filter((t) => typeCounts.has(t)).map((t) => {
            const active = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(active ? null : t)}
                className={clsx(
                  "shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  active ? "bg-ink-100 text-ink-900 ring-1 ring-inset ring-ink-200" : "text-ink-600 hover:bg-ink-50",
                )}
              >
                <DocumentTypeBadge type={t} />
                <span className="tabular-nums text-ink-500">{typeCounts.get(t)}</span>
              </button>
            );
          })}
        </div>
      </header>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-4 w-4" />}
          title="No contracts match this filter"
          description="Try a different filter or create a new contract from the sidebar."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] table-fixed">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "2%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-ink-100">
                <SortableTh field="name" sort={sort} onClick={toggleSort} className="px-5">Contract</SortableTh>
                <SortableTh field="type" sort={sort} onClick={toggleSort}>Type</SortableTh>
                <SortableTh field="counterparty" sort={sort} onClick={toggleSort}>Counterparty</SortableTh>
                <SortableTh field="valueEur" sort={sort} onClick={toggleSort} align="right">Value</SortableTh>
                <SortableTh field="stage" sort={sort} onClick={toggleSort}>Stage</SortableTh>
                <SortableTh field="owner" sort={sort} onClick={toggleSort}>Owner</SortableTh>
                <SortableTh field="updatedAt" sort={sort} onClick={toggleSort}>Updated</SortableTh>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {sorted.map((c) => (
                <tr key={c.id} className="row-hover">
                  <td className="px-5 py-3.5 align-top font-medium text-ink-900">
                    <Link href={contractHref(c)} className="flex items-start gap-2.5 hover:underline">
                      <DocumentTypeIcon type={c.type} size="sm" />
                      <span className="line-clamp-2 leading-snug">{c.name}</span>
                      {isStale(c) && (
                        <span
                          className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200"
                          title={`No movement for ${Math.floor(stageAgeDays(c))} days. Consider pinging the approver or reassigning.`}
                        >
                          <Clock className="h-2.5 w-2.5" /> stale
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 align-top"><DocumentTypeBadge type={c.type} /></td>
                  <td className="px-3 py-3.5 align-top text-ink-600">
                    <span className="line-clamp-2 leading-snug">{c.counterparty}</span>
                  </td>
                  <td className="px-3 py-3.5 text-right align-top tabular-nums text-ink-700">{formatEurCompact(c.valueEur)}</td>
                  <td className="px-3 py-3.5 align-top"><StatusBadge stage={c.stage} /></td>
                  <td className="px-3 py-3.5 align-top">
                    <div className="flex items-start gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[10px] font-semibold text-ink-700">
                        {initials(c.owner)}
                      </div>
                      <div className="line-clamp-2 text-xs leading-snug text-ink-600">{c.owner}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 align-top whitespace-nowrap text-xs text-ink-500">{relativeDays(c.updatedAt)}</td>
                  <td className="px-5 py-3.5 text-right align-top">
                    <Link href={contractHref(c)} className="inline-flex items-center text-ink-400 hover:text-ink-900">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SortableTh({
  field,
  sort,
  onClick,
  children,
  className,
  align = "left",
}: {
  field: SortField;
  sort: { field: SortField; dir: SortDir };
  onClick: (f: SortField) => void;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const active = sort.field === field;
  return (
    <th
      onClick={() => onClick(field)}
      className={clsx(
        "cursor-pointer select-none px-3 py-2.5 hover:bg-ink-50/60",
        align === "right" && "text-right",
        className,
      )}
    >
      <span className={clsx("inline-flex items-center gap-1", align === "right" && "justify-end")}>
        {children}
        {active ? (
          sort.dir === "asc" ? <ArrowUp className="h-3 w-3 text-ink-700" /> : <ArrowDown className="h-3 w-3 text-ink-700" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-ink-300" />
        )}
      </span>
    </th>
  );
}

function contractHref(c: Contract): string {
  if (c.stage === "signed" || c.stage === "filed") {
    return `/contracts/${c.id}/signed`;
  }
  return `/contracts/${c.id}`;
}

function applyFilter(contracts: Contract[], filter: Filter, awaitingRole: string): Contract[] {
  if (filter === "all") {
    return contracts.filter((c) => c.stage !== "filed");
  }
  if (filter === "awaiting_me") {
    return contracts.filter((c) =>
      (c.approvals ?? []).some((a) => a.role === awaitingRole && a.status === "pending"),
    );
  }
  if (filter === "blocked") {
    return contracts.filter((c) => {
      if (c.stage === "in_review") return true;
      if (c.stage === "awaiting_approval" && (c.approvals ?? []).some((a) => a.status === "pending")) return true;
      return false;
    });
  }
  if (filter === "in_review") {
    return contracts.filter((c) => c.stage === "in_review" || c.stage === "checks_running");
  }
  return contracts;
}

function sortContracts(contracts: Contract[], sort: { field: SortField; dir: SortDir }): Contract[] {
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...contracts].sort((a, b) => {
    const cmp = compareBy(a, b, sort.field);
    return cmp * sign;
  });
}

/**
 * "Stale" = blocked status AND no stage transition in the last 3 days.
 * This is the row-level signal we lost when the Blocked KPI dropped its
 * >3-day threshold. The KPI tile counts everything blocked (matching the
 * filter tab); the row badge surfaces the urgency.
 */
function isStale(c: Contract): boolean {
  const blocked =
    c.stage === "awaiting_approval" ||
    c.stage === "in_review" ||
    (c.stage === "sent" && !c.signedAt);
  if (!blocked) return false;
  return stageAgeDays(c) > 3;
}

function compareBy(a: Contract, b: Contract, field: SortField): number {
  switch (field) {
    case "name":
    case "counterparty":
    case "owner":
      return a[field].localeCompare(b[field]);
    case "type":
      return a.type.localeCompare(b.type);
    case "valueEur":
      return (a.valueEur ?? -1) - (b.valueEur ?? -1);
    case "stage":
      return STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage];
    case "updatedAt":
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    default:
      return 0;
  }
}
