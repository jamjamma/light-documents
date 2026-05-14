"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { KpiStrip } from "@/components/KpiStrip";
import { AboutWidget } from "@/components/AboutWidget";
import { ContractsTable } from "@/components/ContractsTable";
import { Button } from "@/components/ui/Button";
import { listContracts, computeKpis } from "@/lib/contract-store";
import {
  hasSeenTour,
  markTourSeen,
  writeTourState,
  type TourEffect,
} from "@/lib/tour-steps";
import type { Contract } from "@/lib/types";

type Filter = "all" | "awaiting_me" | "blocked" | "in_review";

export default function DashboardPage() {
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setContracts(listContracts());

    // Auto-show the tour ONCE per browser, ever. After the first auto-start
    // (or any manual trigger), we set `tour-seen` and never auto-start again.
    // Users can still re-trigger via the sidebar button.
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

  // Listen for tour effect events so filter-walk steps can actually
  // drive the table filter while the popover narrates. The TourController
  // dispatches these on step render; we map them onto setFilter.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ effect?: TourEffect }>).detail;
      switch (detail?.effect) {
        case "filter:all":
          setFilter("all");
          break;
        case "filter:awaiting_me":
          setFilter("awaiting_me");
          break;
        case "filter:blocked":
          setFilter("blocked");
          break;
        case "filter:in_review":
          setFilter("in_review");
          break;
      }
    };
    window.addEventListener("tour:effect", handler);
    return () => window.removeEventListener("tour:effect", handler);
  }, []);

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
                hint: "approvers haven't responded",
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
