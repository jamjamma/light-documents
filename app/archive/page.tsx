"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { KpiStrip } from "@/components/KpiStrip";
import { DocumentTypeBadge, DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { listContracts } from "@/lib/contract-store";
import { formatDateTime, formatEurCompact, initials } from "@/lib/format";
import { Archive as ArchiveIcon, ChevronRight, FileCheck } from "lucide-react";
import type { Contract, DocumentType } from "@/lib/types";

export default function ArchivePage() {
  const [contracts, setContracts] = useState<Contract[] | null>(null);

  useEffect(() => {
    setContracts(listContracts());
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

  const kpis = useMemo(() => computeArchiveKpis(signed), [signed]);

  if (contracts === null) {
    return (
      <>
        <Header title="Signed contracts" />
      </>
    );
  }

  const customerCount = (kpis.byType.get("MSA") ?? 0) + (kpis.byType.get("Order Form") ?? 0) + (kpis.byType.get("NDA") ?? 0);
  const peopleCount = kpis.byType.get("Employment") ?? 0;
  const equityCount = kpis.byType.get("Warrant") ?? 0;

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
            { label: "Total signed", value: String(kpis.totalSigned) },
            { label: "Customer contracts", value: String(customerCount), hint: "MSAs, Order Forms, NDAs" },
            { label: "People", value: String(peopleCount), hint: "Employment contracts" },
            { label: "Equity", value: String(equityCount), hint: "Warrant agreements" },
          ]}
        />

        {/* Entity breakdown: a secondary line, not a KPI tile */}
        {kpis.byEntity.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-ink-50 px-4 py-2 text-[12px] text-ink-500">
            <span className="font-medium text-ink-700">By entity</span>
            <span className="text-ink-300">·</span>
            {Array.from(kpis.byEntity.entries()).map(([entity, count]) => (
              <span key={entity} className="inline-flex items-center gap-1.5">
                <span className="text-ink-700">{entity}</span>
                <span className="tabular-nums text-ink-500">{count}</span>
              </span>
            ))}
          </div>
        )}

        <Card title="Signed and filed contracts" subtitle={`${signed.length} record${signed.length === 1 ? "" : "s"}, most recent first.`}>
          {signed.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-ink-500">
              No signed contracts yet. Contracts appear here once they reach the Filed stage.
            </div>
          ) : (
            <ul className="space-y-2">
              {signed.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/contracts/${c.id}/signed`}
                    className="group flex items-start gap-3 rounded-lg border border-ink-100 bg-white p-3 hover:border-ink-300 hover:shadow-card"
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
                        <div className="mt-1.5 text-[11px] text-sage-500 flex items-center gap-1">
                          <FileCheck className="h-3 w-3" />
                          {c.ledger.headline}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-400 group-hover:text-ink-900" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

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

interface ArchiveKpis {
  totalSigned: number;
  byType: Map<DocumentType, number>;
  byEntity: Map<string, number>;
}

function computeArchiveKpis(signed: Contract[]): ArchiveKpis {
  const byType = new Map<DocumentType, number>();
  const byEntity = new Map<string, number>();
  for (const c of signed) {
    byType.set(c.type, (byType.get(c.type) ?? 0) + 1);
    if (c.fields.lightEntity) {
      byEntity.set(c.fields.lightEntity, (byEntity.get(c.fields.lightEntity) ?? 0) + 1);
    }
  }
  return { totalSigned: signed.length, byType, byEntity };
}
