"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { addManualSourceRecord } from "@/lib/contract-store";
import type { SourceRecord, Template } from "@/lib/types";
import { Plus } from "lucide-react";

interface Props {
  open: boolean;
  template: Template;
  onClose: () => void;
  onCreated: (record: SourceRecord) => void;
}

type RecordType = SourceRecord["type"];

function recordTypeForTemplate(t: Template): RecordType {
  if (t.type === "MSA" || t.type === "NDA" || t.type === "Order Form") return "deal";
  if (t.type === "Employment") return "candidate";
  if (t.type === "Warrant") return "stakeholder";
  return "deal";
}

interface FieldSpec {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "date";
  placeholder?: string;
  required?: boolean;
}

// Per-record-type field set. These map to ContractFields keys so the new-contract
// intake form prefills correctly when the user selects this record.
const FIELDS_BY_TYPE: Record<RecordType, FieldSpec[]> = {
  deal: [
    { key: "counterpartyLegalName", label: "Counterparty legal name", type: "text", required: true, placeholder: "e.g. Acme GmbH" },
    { key: "counterpartySignerName", label: "Signer name", type: "text", required: true, placeholder: "Authorised signatory" },
    { key: "counterpartySignerTitle", label: "Signer title", type: "text", placeholder: "Head of Procurement" },
    { key: "counterpartySignerEmail", label: "Signer email", type: "email", required: true, placeholder: "signer@example.com" },
    { key: "contractValueEur", label: "Contract value (EUR ARR)", type: "number", placeholder: "60000" },
    { key: "paymentTermsDays", label: "Payment terms (days)", type: "number", placeholder: "30" },
    { key: "termMonths", label: "Initial term (months)", type: "number", placeholder: "12" },
  ],
  candidate: [
    { key: "candidateName", label: "Candidate name", type: "text", required: true, placeholder: "e.g. Alex Müller" },
    { key: "counterpartySignerEmail", label: "Candidate email", type: "email", required: true, placeholder: "alex@example.com" },
    { key: "role", label: "Role", type: "text", required: true, placeholder: "Senior Engineer" },
    { key: "manager", label: "Reporting manager", type: "text", placeholder: "Reports to whom?" },
    { key: "salaryEur", label: "Annual salary (EUR)", type: "number", placeholder: "95000" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "equityBps", label: "Equity grant (basis points, 0 if none)", type: "number", placeholder: "0" },
  ],
  stakeholder: [
    { key: "stakeholderName", label: "Stakeholder name", type: "text", required: true, placeholder: "e.g. Anya Petrov" },
    { key: "warrantPct", label: "Warrant percentage", type: "number", required: true, placeholder: "0.25" },
    { key: "vestingMonths", label: "Vesting (months)", type: "number", placeholder: "48" },
    { key: "cliffMonths", label: "Cliff (months)", type: "number", placeholder: "12" },
    { key: "boardResolutionRef", label: "Board resolution reference", type: "text", placeholder: "BR-2026-Q2-001" },
  ],
  vendor: [
    { key: "vendorName", label: "Vendor name", type: "text", required: true, placeholder: "e.g. Datadog Inc." },
    { key: "vendorService", label: "Service description", type: "text", placeholder: "APM + log management" },
    { key: "monthlySpendEur", label: "Monthly spend (EUR)", type: "number", placeholder: "2500" },
    { key: "counterpartySignerName", label: "Signer name", type: "text", required: true },
    { key: "counterpartySignerEmail", label: "Signer email", type: "email", required: true },
  ],
};

const TYPE_LABEL: Record<RecordType, string> = {
  deal: "Deal / customer",
  candidate: "Candidate",
  stakeholder: "Stakeholder",
  vendor: "Vendor",
};

const SUBTITLE_BUILDERS: Record<RecordType, (d: Record<string, string | number | boolean>) => string> = {
  deal: (d) => {
    const parts: string[] = [];
    if (d.contractValueEur) parts.push(`€${Number(d.contractValueEur).toLocaleString()} ARR`);
    if (d.paymentTermsDays) parts.push(`Net ${d.paymentTermsDays}`);
    if (d.termMonths) parts.push(`${d.termMonths}-month term`);
    return parts.join(" · ") || "Manually entered deal";
  },
  candidate: (d) => {
    const parts: string[] = [];
    if (d.role) parts.push(String(d.role));
    if (d.salaryEur) parts.push(`€${Number(d.salaryEur).toLocaleString()}`);
    if (d.equityBps && Number(d.equityBps) > 0) parts.push(`${d.equityBps}bps equity`);
    return parts.join(" · ") || "Manually entered candidate";
  },
  stakeholder: (d) => {
    const parts: string[] = [];
    if (d.warrantPct) parts.push(`${d.warrantPct}% warrant grant`);
    if (d.vestingMonths) parts.push(`Vesting ${d.vestingMonths}m`);
    if (d.cliffMonths) parts.push(`cliff ${d.cliffMonths}m`);
    return parts.join(" · ") || "Manually entered stakeholder";
  },
  vendor: (d) => {
    const parts: string[] = [];
    if (d.vendorService) parts.push(String(d.vendorService));
    if (d.monthlySpendEur) parts.push(`€${Number(d.monthlySpendEur).toLocaleString()}/month`);
    return parts.join(" · ") || "Manually entered vendor";
  },
};

/**
 * Modal for manually adding a source record. Fields are type-aware:
 * deal-shaped for MSAs/NDAs/Order Forms, candidate-shaped for Employment,
 * stakeholder-shaped for Warrants. New record persists to localStorage,
 * shows in the picker on next render, and auto-selects via onCreated.
 */
export function ManualEntryModal({ open, template, onClose, onCreated }: Props) {
  const recordType = recordTypeForTemplate(template);
  const fields = useMemo(() => FIELDS_BY_TYPE[recordType], [recordType]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setValues({});
  }, [open, recordType]);

  const missingRequired = fields
    .filter((f) => f.required)
    .filter((f) => !values[f.key] || String(values[f.key]).trim().length === 0);

  const canSubmit = missingRequired.length === 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const data: Record<string, string | number | boolean> = {};
    for (const f of fields) {
      const raw = values[f.key];
      if (raw === undefined || raw === "") continue;
      data[f.key] = f.type === "number" ? Number(raw) : raw;
    }

    const displayName = String(
      data.counterpartyLegalName ??
        data.candidateName ??
        data.stakeholderName ??
        data.vendorName ??
        "Manually entered record",
    );

    const record = addManualSourceRecord({
      type: recordType,
      display: displayName,
      subtitle: SUBTITLE_BUILDERS[recordType](data),
      data,
    });
    onCreated(record);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span>
          Add a {TYPE_LABEL[recordType].toLowerCase()} manually for: <span className="text-ink-500">{template.name}</span>
        </span>
      }
      subtitle={
        <span>
          Manual entry sits next to CRM / HRIS imports. Use this for board advisors, one-off counterparties, or anything not in a connected system. The record persists locally and prefills the intake form.
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} leadingIcon={<Plus className="h-3.5 w-3.5" />}>
            Add &amp; select
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.key === "counterpartyLegalName" || f.key === "candidateName" || f.key === "stakeholderName" || f.key === "vendorName" ? "sm:col-span-2" : ""}>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-500">
                {f.label}
                {f.required && <span className="ml-0.5 text-rose-500">*</span>}
              </label>
              <input
                type={f.type}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-ink-100 bg-ink-50/40 px-3 py-2.5 text-[11px] text-ink-600">
          <span className="demo-note mr-1.5">What happens on Add</span>
          The record is saved to local state, the picker auto-selects it, and step 3 (Confirm details) prefills these values into the intake form. Clause checks + routing fire against the same engine as any imported record. In production this also writes a "manual record" stub to the source system of record (so a Salesforce admin can later attach the deal if needed).
        </div>

        {!canSubmit && missingRequired.length > 0 && (
          <div className="text-[11px] text-ink-500">
            Required: {missingRequired.map((f) => f.label).join(", ")}
          </div>
        )}
      </div>
    </Modal>
  );
}
