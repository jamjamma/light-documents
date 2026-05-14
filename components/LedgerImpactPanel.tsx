import type { LedgerImpact } from "@/lib/types";
import { Database, ArrowRight } from "lucide-react";

interface Props {
  ledger: LedgerImpact;
}

/**
 * Writeback panel rendered on the signed-record page.
 *
 * Structure:
 *  1. Headline + summary rows (always present)
 *  2. One of: journal entry (MSA / Order Form), HRIS record (Employment),
 *     cap-table delta (Warrant). NDAs short-circuit upstream and never render.
 *  3. "Demo" footer note clarifying that production posts via internal API.
 *
 * Visual treatment is intentionally evocative of an ERP screen (monospace
 * amounts, ledger account codes, dimension chips) so the panel looks like
 * something a Finance team would actually receive, not a placeholder card.
 */
export function LedgerImpactPanel({ ledger }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-gradient-to-br from-ink-900 to-ink-800 text-white">
      <div className="border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-accent-300">
          <Database className="h-3.5 w-3.5" />
          Structured writeback &middot;{" "}
          {ledger.journalEntry
            ? "journal entry shape"
            : ledger.hrisRecord
              ? "HRIS record shape"
              : ledger.capTableDelta
                ? "cap-table grant shape"
                : "summary"}
        </div>
        <div className="mt-1.5 text-lg font-semibold tracking-tight">{ledger.headline}</div>
      </div>

      <div className="divide-y divide-white/10">
        {ledger.rows.map((row, i) => (
          <div key={i} className="flex items-start justify-between gap-4 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-white/50">{row.label}</div>
              <div className="mt-0.5 font-medium tabular-nums text-white">{row.value}</div>
            </div>
            {row.note && (
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <ArrowRight className="h-3 w-3" />
                {row.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {ledger.journalEntry && <JournalEntryBlock entry={ledger.journalEntry} />}
      {ledger.hrisRecord && <HrisRecordBlock record={ledger.hrisRecord} />}
      {ledger.capTableDelta && <CapTableBlock delta={ledger.capTableDelta} />}

      <div className="border-t border-white/10 bg-white/5 px-5 py-2.5 text-[11px] text-white/60">
        <span className="font-medium text-accent-300">Demo:</span>{" "}
        The prototype emits this shape on the DocuSign{" "}
        <span className="font-mono text-white/80">envelope-completed</span> webhook. In production it
        posts to whichever endpoint Light exposes (ledger / billing / HRIS / cap table). The integration
        target is also stubbed in this build.
      </div>
    </div>
  );
}

function JournalEntryBlock({ entry }: { entry: NonNullable<LedgerImpact["journalEntry"]> }) {
  return (
    <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[10px] uppercase tracking-wider text-white/50">Journal entry</span>
        <span className="font-mono text-[12px] text-accent-300">{entry.entryNumber}</span>
        <span className="text-[11px] text-white/40">posted {formatPostedAt(entry.postedAt)}</span>
      </div>

      <table className="mt-2 w-full text-[12px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-white/40">
            <th className="py-1 pr-2 font-normal">Side</th>
            <th className="py-1 pr-2 font-normal">Account</th>
            <th className="py-1 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          <tr>
            <td className="py-1.5 pr-2 font-mono text-[11px] text-white/60">DR</td>
            <td className="py-1.5 pr-2 font-mono text-white">{entry.debit.account}</td>
            <td className="py-1.5 text-right font-mono tabular-nums text-white">{entry.debit.amount}</td>
          </tr>
          <tr>
            <td className="py-1.5 pr-2 font-mono text-[11px] text-white/60">CR</td>
            <td className="py-1.5 pr-2 font-mono text-white">{entry.credit.account}</td>
            <td className="py-1.5 text-right font-mono tabular-nums text-white">{entry.credit.amount}</td>
          </tr>
        </tbody>
      </table>

      <DimensionChips dimensions={entry.dimensions} />
    </div>
  );
}

function HrisRecordBlock({ record }: { record: NonNullable<LedgerImpact["hrisRecord"]> }) {
  return (
    <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[10px] uppercase tracking-wider text-white/50">HRIS record</span>
        <span className="font-mono text-[12px] text-accent-300">{record.employeeId}</span>
      </div>
      <div className="mt-1 text-[12px] text-white/80">{record.payrollUpdate}</div>
      <DimensionChips dimensions={record.fields} />
    </div>
  );
}

function CapTableBlock({ delta }: { delta: NonNullable<LedgerImpact["capTableDelta"]> }) {
  return (
    <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[10px] uppercase tracking-wider text-white/50">Cap table grant</span>
        <span className="font-mono text-[12px] text-accent-300">{delta.grantId}</span>
      </div>
      <div className="mt-1 text-[12px] text-white/80">Granted to <span className="font-medium text-white">{delta.stakeholder}</span></div>
      <DimensionChips dimensions={delta.fields} />
    </div>
  );
}

function DimensionChips({ dimensions }: { dimensions: { label: string; value: string }[] }) {
  if (dimensions.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {dimensions.map((d, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/70 ring-1 ring-inset ring-white/10"
        >
          <span className="text-white/40">{d.label}:</span>
          <span className="font-medium text-white/90">{d.value}</span>
        </span>
      ))}
    </div>
  );
}

function formatPostedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  } catch {
    return iso;
  }
}
