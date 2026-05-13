"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { DocumentTypeBadge, DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { listContracts } from "@/lib/contract-store";
import { formatDateTime, formatEur, formatEurCompact, initials } from "@/lib/format";
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

  const kpis = useMemo(() => computeLifetimeKpis(signed), [signed]);

  if (contracts === null) {
    return (
      <>
        <Header title="Archive" subtitle="Loading..." />
      </>
    );
  }

  return (
    <>
      <Header
        title="Archive"
        subtitle="All signed and filed contracts. Lifetime ledger impact across the company."
        breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Archive" }]}
      />
      <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="panel flex items-stretch divide-x divide-ink-100 overflow-hidden">
          <Kpi label="Signed total" value={String(kpis.totalSigned)} />
          <Kpi label="Lifetime ARR booked" value={formatEur(kpis.totalArr)} />
          <Kpi label="Headcount added" value={String(kpis.totalHires)} />
          <Kpi label="Equity granted" value={kpis.totalEquityBps > 0 ? `${(kpis.totalEquityBps / 100).toFixed(2)}%` : "—"} />
        </div>

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
              Archive view also shows: 7-year retention status, deletion holds (for litigation or audit), and re-signed replacements. Each filed PDF is stored in the customer's Drive folder plus our S3 cold storage with WORM (write-once-read-many) compliance for finance regulations.
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-5 py-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 tabular-nums">{value}</div>
    </div>
  );
}

interface LifetimeKpis {
  totalSigned: number;
  totalArr: number;
  totalHires: number;
  totalEquityBps: number;
  byType: Map<DocumentType, number>;
}

function computeLifetimeKpis(signed: Contract[]): LifetimeKpis {
  let totalArr = 0;
  let totalHires = 0;
  let totalEquityBps = 0;
  const byType = new Map<DocumentType, number>();
  for (const c of signed) {
    byType.set(c.type, (byType.get(c.type) ?? 0) + 1);
    if (c.type === "MSA" || c.type === "Order Form") {
      totalArr += c.valueEur ?? 0;
    }
    if (c.type === "Employment") {
      totalHires += 1;
      totalEquityBps += c.fields.equityBps ?? 0;
    }
    if (c.type === "Warrant") {
      totalEquityBps += Math.round((c.fields.warrantPct ?? 0) * 100);
    }
  }
  return { totalSigned: signed.length, totalArr, totalHires, totalEquityBps, byType };
}
