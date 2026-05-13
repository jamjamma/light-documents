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
import type { Contract } from "@/lib/types";

type Filter = "all" | "awaiting_me" | "blocked" | "signed_recent";

export default function DashboardPage() {
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setContracts(listContracts());
  }, []);

  if (contracts === null) {
    return (
      <>
        <Header title="Documents" subtitle="Loading..." />
      </>
    );
  }

  const kpis = computeKpis(contracts);

  return (
    <>
      <Header
        title="Documents"
        subtitle="Every contract, every approval, every signature. One workflow."
        actions={
          <Link href="/contracts/new">
            <Button leadingIcon={<Plus className="h-4 w-4" />}>New contract</Button>
          </Link>
        }
      />

      <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <KpiStrip
          kpis={[
            { label: "In flight", value: String(kpis.inFlight) },
            { label: "Blocked", value: String(kpis.blocked), emphasis: kpis.blocked > 0 },
            { label: "Signed this week", value: String(kpis.signedThisWeek) },
            { label: "Avg cycle", value: kpis.avgCycleDays > 0 ? `${kpis.avgCycleDays} days` : "—", hint: "from create to signed" },
          ]}
        />

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
