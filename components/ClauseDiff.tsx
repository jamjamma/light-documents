"use client";

import { Fragment, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Check, AlertTriangle, OctagonAlert } from "lucide-react";
import type { ClauseCheckResult } from "@/lib/types";
import { summarizeChecks } from "@/lib/clause-checker";

interface Props {
  results: ClauseCheckResult[];
}

const SEVERITY_META = {
  info: { icon: <Check className="h-3.5 w-3.5" />, tone: "text-ink-500", row: "" },
  warn: { icon: <AlertTriangle className="h-3.5 w-3.5" />, tone: "text-accent-500", row: "bg-accent-50/50" },
  block: { icon: <OctagonAlert className="h-3.5 w-3.5" />, tone: "text-rose-500", row: "bg-rose-50/50" },
};

export function ClauseDiff({ results }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (results.length === 0) {
    return <div className="text-sm text-ink-500">No clause check has been run yet.</div>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-ink-700">{summarizeChecks(results)}</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
          <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-sage-500" /> standard</span>
          <span className="inline-flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-accent-500" /> warn</span>
          <span className="inline-flex items-center gap-1.5"><OctagonAlert className="h-3 w-3 text-rose-500" /> block</span>
        </div>
      </div>

      {/* Mobile: stacked cards (4-column table squeezes badly under ~480px) */}
      <ul className="space-y-2 sm:hidden">
        {results.map((r) => {
          const isDeviation = r.status === "deviation";
          const meta = isDeviation ? SEVERITY_META[r.severity] : SEVERITY_META.info;
          const isOpen = expanded === r.key;
          return (
            <li
              key={r.key}
              className={clsx(
                "overflow-hidden rounded-lg border border-ink-100 bg-white text-[13px]",
                isDeviation && meta.row,
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : r.key)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left"
              >
                <span className={clsx("mt-0.5 shrink-0", meta.tone)}>
                  {isDeviation ? meta.icon : <Check className="h-3.5 w-3.5 text-sage-500" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink-900">{r.label}</div>
                  <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[12px]">
                    <span className="text-ink-500">Master expects</span>
                    <span className="text-ink-700">{r.expected}</span>
                    <span className="text-ink-500">Observed</span>
                    <span className={clsx(isDeviation ? "font-medium text-ink-900" : "text-ink-700")}>
                      {r.observed}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={clsx(
                    "mt-0.5 h-4 w-4 shrink-0 text-ink-400 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <div className="border-t border-ink-100 px-3 py-2.5">
                  {isDeviation ? (
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-[12px]">
                        <span className={meta.tone}>{meta.icon}</span>
                        <span className="font-medium text-ink-900">
                          {r.severity === "block" ? "Blocking" : r.severity === "warn" ? "Warning" : "Note"}: deviates from master
                        </span>
                      </div>
                      {r.reason && <div className="ml-5 text-[12px] text-ink-700">{r.reason}</div>}
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5 text-[12px]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-500" />
                      <span className="text-ink-700">Standard. Matches the master template.</span>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Desktop / tablet: keep the table */}
      <div className="hidden overflow-hidden rounded-lg border border-ink-100 sm:block">
        <table className="text-sm">
          <thead className="bg-ink-50/60">
            <tr className="border-b border-ink-100">
              <th className="w-8 px-4 py-2.5"></th>
              <th className="px-4 py-2.5">Clause</th>
              <th className="px-4 py-2.5">Master expects</th>
              <th className="px-4 py-2.5">Observed in this contract</th>
              <th className="w-8 px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {results.map((r) => {
              const isDeviation = r.status === "deviation";
              const meta = isDeviation ? SEVERITY_META[r.severity] : SEVERITY_META.info;
              const isOpen = expanded === r.key;
              return (
                <Fragment key={r.key}>
                  <tr
                    className={clsx("cursor-pointer hover:bg-ink-50/60", isDeviation && meta.row)}
                    onClick={() => setExpanded(isOpen ? null : r.key)}
                  >
                    <td className="px-4 py-2.5">
                      <span className={meta.tone}>
                        {isDeviation ? meta.icon : <Check className="h-3.5 w-3.5 text-sage-500" />}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink-900">{r.label}</td>
                    <td className="px-4 py-2.5 text-ink-600">{r.expected}</td>
                    <td className={clsx("px-4 py-2.5", isDeviation ? "font-medium text-ink-900" : "text-ink-600")}>
                      {r.observed}
                    </td>
                    <td className="px-4 py-2.5 text-ink-400">
                      <ChevronDown className={clsx("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={5} className={clsx("px-4 py-3", isDeviation && meta.row)}>
                        {isDeviation ? (
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-1.5 text-[12px]">
                              <span className={meta.tone}>{meta.icon}</span>
                              <span className="font-medium text-ink-900">
                                {r.severity === "block" ? "Blocking" : r.severity === "warn" ? "Warning" : "Note"}: deviates from master
                              </span>
                            </div>
                            {r.reason && (
                              <div className="ml-5 text-[12px] text-ink-700">{r.reason}</div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-1.5 text-[12px]">
                              <Check className="h-3.5 w-3.5 text-sage-500" />
                              <span className="font-medium text-ink-900">Standard. Matches the master template.</span>
                            </div>
                            <div className="ml-5 text-[12px] text-ink-600">
                              Master expects: <span className="font-medium text-ink-800">{r.expected}</span>. Observed: <span className="font-medium text-ink-800">{r.observed}</span>. No deviation, no approval impact from this clause.
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-ink-500">
        <span className="demo-note mr-2">Demo</span>
        Deterministic rules engine in this prototype. Production calls Claude API with the master template text and the
        populated document for natural-language clause comparison. The UI binds to the same <span className="font-mono">ClauseCheckResult[]</span> shape.
      </div>
    </div>
  );
}
