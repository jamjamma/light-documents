"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, X } from "lucide-react";
import { Header } from "@/components/Header";
import { KpiStrip } from "@/components/KpiStrip";
import { AboutWidget } from "@/components/AboutWidget";
import { ContractsTable } from "@/components/ContractsTable";
import { Button } from "@/components/ui/Button";
import { listContracts, computeKpis } from "@/lib/contract-store";
import { hasSeenTour, markTourSeen, writeTourState } from "@/lib/tour-steps";
import type { Contract } from "@/lib/types";

type Filter = "all" | "awaiting_me" | "blocked" | "in_review";

const CALLOUT_DISMISS_KEY = "callout-msa-flow-dismissed";
const HERO_MSA_HREF = "/contracts/c_bolt_msa";

export default function DashboardPage() {
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [calloutDismissed, setCalloutDismissed] = useState<boolean>(true);

  useEffect(() => {
    setContracts(listContracts());
    try {
      setCalloutDismissed(window.localStorage.getItem(CALLOUT_DISMISS_KEY) === "true");
    } catch {
      setCalloutDismissed(false);
    }

    // Auto-show the tour ONCE per browser, ever. After the first auto-start
    // (or any manual trigger), we set `tour-seen` and never auto-start again.
    // Users can still re-trigger via the sidebar / callout buttons.
    const isFirstEver = !hasSeenTour();
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    if (isFirstEver && isDesktop) {
      // Mark seen IMMEDIATELY so a refresh during the auto-start delay
      // doesn't queue a second tour.
      markTourSeen();
      // Brief delay so the page has hydrated and anchors are mounted.
      const t = window.setTimeout(() => {
        writeTourState({ active: true, stepIndex: 0 });
        window.dispatchEvent(new CustomEvent("tour:start"));
      }, 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  const dismissCallout = () => {
    setCalloutDismissed(true);
    try {
      window.localStorage.setItem(CALLOUT_DISMISS_KEY, "true");
    } catch {
      // ignore
    }
  };

  if (contracts === null) {
    return (
      <>
        <Header title="Documents" />
      </>
    );
  }

  const kpis = computeKpis(contracts);

  return (
    <>
      <Header
        title="Documents"
        actions={
          <Link href="/contracts/new">
            <Button leadingIcon={<Plus className="h-4 w-4" />}>New contract</Button>
          </Link>
        }
      />

      <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {/* Primary KPI strip: operator-actionable. Click any tile to filter the table below. */}
        <div className="tour-anchor-kpis">
          <KpiStrip
            kpis={[
              {
                label: "Awaiting me",
                value: String(kpis.awaitingMe),
                hint: "pending your approval",
                emphasis: kpis.awaitingMe > 0,
                onClick: () => setFilter("awaiting_me"),
                active: filter === "awaiting_me",
              },
              {
                label: "Blocked",
                value: String(kpis.blocked),
                hint: "awaiting approval or in review",
                emphasis: kpis.blocked > 0,
                onClick: () => setFilter("blocked"),
                active: filter === "blocked",
              },
              {
                label: "In review",
                value: String(kpis.inReview),
                hint: "clause check or legal review",
                onClick: () => setFilter("in_review"),
                active: filter === "in_review",
              },
            ]}
          />
        </div>

        {/* Secondary metric: leadership view, demoted. Cycle time is the workflow's vital sign. */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 px-4 py-2 text-[12px] text-ink-500">
          <span>
            <span className="font-medium text-ink-700">Cycle health</span>{" "}
            <span className="mx-2 text-ink-300">·</span>{" "}
            Avg create-to-signed:{" "}
            <span className="font-medium tabular-nums text-ink-900">
              {kpis.avgCycleDays > 0 ? `${kpis.avgCycleDays} days` : "—"}
            </span>
          </span>
          <Link href="/archive" className="text-ink-500 hover:text-ink-900">
            Signed contracts →
          </Link>
        </div>

        {!calloutDismissed && (
          <div className="tour-anchor-callout flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50/60 px-4 py-3">
            <div className="flex-1 text-[13px] text-ink-700">
              <span className="font-medium text-ink-900">New here?</span>{" "}
              Open <strong>Bolt MSA</strong> to walk the demo path, or take the guided tour from the sidebar.
            </div>
            <Link
              href={HERO_MSA_HREF}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-ink-800"
            >
              Open Bolt MSA
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={dismissCallout}
              aria-label="Dismiss"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <AboutWidget />

        <ContractsTable
          contracts={contracts}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
    </>
  );
}
