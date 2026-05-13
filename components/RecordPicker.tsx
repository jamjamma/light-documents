"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import { Search, Plug, Plus, Check } from "lucide-react";
import { SOURCE_RECORDS } from "@/lib/mock-data";
import type { SourceRecord, Template, SourceSystem } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "./ui/EmptyState";
import { Button } from "./ui/Button";

interface Props {
  template: Template;
  selected: SourceRecord | null;
  onSelect: (r: SourceRecord) => void;
}

const SYSTEM_TONE: Record<SourceSystem, string> = {
  Salesforce: "bg-blue-50 text-blue-700 ring-blue-200",
  HubSpot: "bg-orange-50 text-orange-700 ring-orange-200",
  Attio: "bg-purple-50 text-purple-700 ring-purple-200",
  Pipedrive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Personio: "bg-teal-50 text-teal-700 ring-teal-200",
  Ashby: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Workday: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Manual entry": "bg-ink-50 text-ink-600 ring-ink-200",
};

function recordTypeForTemplate(t: Template): SourceRecord["type"] {
  if (t.type === "MSA" || t.type === "NDA" || t.type === "Order Form") return "deal";
  if (t.type === "Employment") return "candidate";
  if (t.type === "Warrant") return "stakeholder";
  return "deal";
}

export function RecordPicker({ template, selected, onSelect }: Props) {
  const [q, setQ] = useState("");
  const [systemFilter, setSystemFilter] = useState<SourceSystem | "all">("all");

  const wanted = recordTypeForTemplate(template);
  const eligible = useMemo(() => SOURCE_RECORDS.filter((r) => r.type === wanted), [wanted]);

  const systemCounts = useMemo(() => {
    const counts = new Map<SourceSystem, number>();
    for (const r of eligible) counts.set(r.system, (counts.get(r.system) ?? 0) + 1);
    return counts;
  }, [eligible]);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    return eligible
      .filter((r) => systemFilter === "all" || r.system === systemFilter)
      .filter(
        (r) =>
          !lower ||
          r.display.toLowerCase().includes(lower) ||
          r.subtitle.toLowerCase().includes(lower) ||
          (r.externalRef ?? "").toLowerCase().includes(lower),
      );
  }, [q, eligible, systemFilter]);

  const systemFilters: { id: SourceSystem | "all"; label: string }[] = [
    { id: "all", label: "All sources" },
    ...Array.from(systemCounts.entries()).map(([s, n]) => ({
      id: s,
      label: `${s} (${n})`,
    })),
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {systemFilters.map((f) => (
          <button
            key={f.id}
            onClick={() => setSystemFilter(f.id as SourceSystem | "all")}
            className={clsx(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              systemFilter === f.id ? "bg-ink-900 text-white" : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${wanted}s by name, terms, or external reference...`}
            className="h-9 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
          />
        </div>
        <Button variant="secondary" size="sm" leadingIcon={<Plus className="h-3.5 w-3.5" />}>
          Add manually
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-4 w-4" />}
          title={q ? "No matches" : `No ${wanted}s connected`}
          description={
            q
              ? "Try a different search term, change source filter, or add the record manually."
              : "Connect a source system to pull records automatically. Or add this record manually."
          }
          actions={
            !q ? (
              <>
                <Button variant="secondary" size="sm">Connect Salesforce</Button>
                <Button variant="secondary" size="sm">Connect HubSpot</Button>
                <Button variant="ghost" size="sm" leadingIcon={<Plus className="h-3.5 w-3.5" />}>Add manually</Button>
              </>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((r) => {
            const active = selected?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className={clsx(
                  "group rounded-xl border p-3.5 text-left transition-all",
                  active
                    ? "border-ink-900 bg-white shadow-card ring-1 ring-ink-900/10"
                    : "border-ink-200 bg-white hover:border-ink-300 hover:shadow-card",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-ink-900">{r.display}</span>
                      <span
                        className={clsx(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                          SYSTEM_TONE[r.system],
                        )}
                      >
                        via {r.system}
                      </span>
                    </div>
                    {r.externalRef && (
                      <div className="mt-0.5 font-mono text-[10px] text-ink-400">{r.externalRef}</div>
                    )}
                  </div>
                  {active && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div className="mt-1.5 text-[12px] leading-relaxed text-ink-600">{r.subtitle}</div>
                {(r.data.counterpartySignerName || r.data.candidateName) && (
                  <div className="mt-2 border-t border-ink-100 pt-2 text-[11px] text-ink-500">
                    <span className="text-ink-400">Signer: </span>
                    <span className="text-ink-700">
                      {(r.data.counterpartySignerName as string) ?? (r.data.candidateName as string) ?? ""}
                    </span>
                    {r.data.counterpartySignerTitle && (
                      <span className="text-ink-500">, {r.data.counterpartySignerTitle as string}</span>
                    )}
                  </div>
                )}
                <div className="mt-1.5 text-[10px] uppercase tracking-wider text-ink-400">
                  Synced {formatDateTime(r.syncedAt)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
