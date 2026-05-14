"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/StatusBadge";
import { AuditTrail } from "@/components/AuditTrail";
import { LedgerImpactPanel } from "@/components/LedgerImpactPanel";
import { getContract } from "@/lib/contract-store";
import { getTemplate } from "@/lib/mock-data";
import type { Contract } from "@/lib/types";
import { ArrowLeft, FileType2, Download, ShieldCheck, FileCheck } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default function SignedRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    setContract(getContract(id) ?? null);
  }, [id]);

  if (contract === null) {
    return <Header title="Loading..." />;
  }
  if (!contract) {
    return (
      <>
        <Header title="Contract not found" subtitle={id} />
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <Link href="/" className="text-sm text-ink-700 hover:underline">Back to dashboard</Link>
        </div>
      </>
    );
  }

  const template = getTemplate(contract.templateId);
  if (!template) return null;
  const isSigned = contract.stage === "signed" || contract.stage === "filed";

  return (
    <>
      <Header
        title={contract.name}
        subtitle={`Signed record · ${template.name} ${template.version}`}
        breadcrumb={[
          { label: "Dashboard", href: "/" },
          { label: contract.name },
          { label: "Signed record" },
        ]}
        actions={<BackButton fallback="/" label="Back" />}
      />

      <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {isSigned && (
          <div className="tour-anchor-signed-banner flex items-center gap-3 rounded-xl border border-sage-500/30 bg-sage-50 px-5 py-3 text-[13px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-500 text-white">
              <FileCheck className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ink-900">Signed and filed</div>
              <div className="text-ink-600">
                {contract.envelopeId && <>Envelope <span className="font-mono">{contract.envelopeId}</span> · </>}
                Signed {formatDateTime(contract.signedAt)} · Stored in Drive · eIDAS QES verified
              </div>
            </div>
            <StatusBadge stage={contract.stage} />
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="tour-anchor-signed-document">
            <Card title="Signed document" subtitle="PDF retained, audit trail attached.">
              <div className="flex items-center gap-4 rounded-lg border border-ink-200 bg-ink-50/40 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-card">
                  <FileType2 className="h-5 w-5 text-ink-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink-900">{contract.name}.pdf</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink-500">
                    <span>{template.name} {template.version}</span>
                    <span>·</span>
                    <span>2 signers</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-sage-500" />
                      eIDAS QES
                    </span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" leadingIcon={<Download className="h-3.5 w-3.5" />}>
                  Download
                </Button>
              </div>
              <div className="mt-3 text-[11px] text-ink-500">
                <span className="demo-note mr-1.5">Demo</span>
                Production stores the signed PDF and the DocuSign Certificate of Completion in the customer's Drive (or SharePoint) archive folder.
              </div>
            </Card>
            </div>

            <div className="tour-anchor-audit-trail">
            <Card title="Audit trail" subtitle="Every step with timestamp, actor, and notification channel.">
              <AuditTrail events={contract.audit} />
            </Card>
            </div>
          </div>

          <div className="tour-anchor-ledger space-y-4">
            {contract.ledger ? (
              <LedgerImpactPanel ledger={contract.ledger} />
            ) : (
              <Card title="Ledger impact">
                <div className="text-[13px] text-ink-500">
                  {contract.type === "NDA" ? (
                    <>
                      NDAs do not write to the ledger by design. There is no MRR, headcount, or equity to record. The signed document is filed for retention and the audit trail above is the system of record (who signed, when, on which template version).
                    </>
                  ) : (
                    <>
                      Ledger writeback will appear here after the contract is filed. The Light ledger is updated with the structured data from the signed contract (MRR for {contract.type === "MSA" || contract.type === "Order Form" ? "customer contracts" : contract.type === "Employment" ? "headcount + payroll" : "cap table"}).
                    </>
                  )}
                </div>
              </Card>
            )}

            <Card title="Linked records">
              <ul className="space-y-2 text-[13px]">
                <li className="flex items-center justify-between gap-2">
                  <span className="text-ink-500">Source record</span>
                  <Badge tone="slate">{contract.sourceRecordId}</Badge>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-ink-500">Template version</span>
                  <span className="font-mono text-[11px]">{template.id} ({template.version})</span>
                </li>
                {contract.envelopeId && (
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-ink-500">DocuSign envelope</span>
                    <span className="font-mono text-[11px]">{contract.envelopeId}</span>
                  </li>
                )}
                <li className="flex items-center justify-between gap-2">
                  <span className="text-ink-500">Counterparty</span>
                  <span className="font-medium">{contract.counterparty}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-ink-500">Owner</span>
                  <span>{contract.owner} ({contract.ownerTeam})</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
