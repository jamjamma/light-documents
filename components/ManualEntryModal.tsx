"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { addManualSourceRecord } from "@/lib/contract-store";
import type { SourceRecord, Template } from "@/lib/types";
import { AlertTriangle, Plus } from "lucide-react";

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
  /** Pre-filled when the modal opens. Use for safe boilerplate that the user
   *  will usually keep (standard vesting cadences, etc.). Never pre-fill names,
   *  emails, or anything legally consequential. */
  defaultValue?: string;
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
    { key: "paymentTermsDays", label: "Payment terms (days)", type: "number", placeholder: "30", defaultValue: "30" },
    { key: "termMonths", label: "Initial term (months)", type: "number", placeholder: "12", defaultValue: "12" },
  ],
  candidate: [
    { key: "candidateName", label: "Candidate name", type: "text", required: true, placeholder: "e.g. Alex Müller" },
    { key: "counterpartySignerEmail", label: "Candidate email", type: "email", required: true, placeholder: "alex@example.com" },
    { key: "role", label: "Role", type: "text", required: true, placeholder: "Senior Engineer" },
    { key: "manager", label: "Reporting manager", type: "text", placeholder: "Reports to whom?" },
    { key: "salaryEur", label: "Annual salary (EUR)", type: "number", placeholder: "95000" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "equityBps", label: "Equity grant (basis points, 0 if none)", type: "number", placeholder: "0", defaultValue: "0" },
  ],
  stakeholder: [
    { key: "stakeholderName", label: "Stakeholder name", type: "text", required: true, placeholder: "e.g. Anya Petrov" },
    { key: "warrantPct", label: "Warrant percentage", type: "number", required: true, placeholder: "e.g. 0.25" },
    { key: "vestingMonths", label: "Vesting (months)", type: "number", placeholder: "48", defaultValue: "48" },
    { key: "cliffMonths", label: "Cliff (months)", type: "number", placeholder: "12", defaultValue: "12" },
    { key: "boardResolutionRef", label: "Board resolution reference", type: "text", placeholder: "e.g. BR-2026-Q2-001" },
  ],
  vendor: [
    { key: "vendorName", label: "Vendor name", type: "text", required: true, placeholder: "e.g. Datadog Inc." },
    { key: "vendorService", label: "Service description", type: "text", placeholder: "APM + log management" },
    { key: "monthlySpendEur", label: "Monthly spend (EUR)", type: "number", placeholder: "2500" },
    { key: "counterpartySignerName", label: "Signer name", type: "text", required: true, placeholder: "Authorised signatory" },
    { key: "counterpartySignerEmail", label: "Signer email", type: "email", required: true, placeholder: "signer@example.com" },
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
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Seed the form with safe, non-binding defaults (vesting cadences, payment
  // terms) every time the modal opens. We never pre-fill names, emails, or
  // anything that would change the contract's legal substance.
  useEffect(() => {
    if (!open) return;
    const seed: Record<string, string> = {};
    for (const f of fields) {
      if (f.defaultValue !== undefined) seed[f.key] = f.defaultValue;
    }
    setValues(seed);
    // Focus the first input so the keyboard pops up immediately on mobile.
    const t = setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, recordType, fields]);

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
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          {!canSubmit && (
            <div
              role="status"
              className="flex flex-1 items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900 ring-1 ring-inset ring-amber-200 sm:text-left"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
              <span>
                Fill {missingRequired.map((f) => `"${f.label}"`).join(" + ")} to enable Add.
              </span>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 sm:shrink-0">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              leadingIcon={<Plus className="h-3.5 w-3.5" />}
              title={canSubmit ? undefined : `Fill ${missingRequired.map((f) => f.label).join(" + ")} first`}
            >
              Add &amp; select
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f, i) => {
            const isWide = f.key === "counterpartyLegalName" || f.key === "candidateName" || f.key === "stakeholderName" || f.key === "vendorName";
            const isMissing = f.required && (!values[f.key] || String(values[f.key]).trim().length === 0);
            return (
              <div key={f.key} className={isWide ? "sm:col-span-2" : ""}>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-500">
                  {f.label}
                  {f.required && <span className="ml-0.5 text-rose-500">*</span>}
                </label>
                <input
                  ref={i === 0 ? firstInputRef : undefined}
                  type={f.type}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  aria-required={f.required || undefined}
                  className={`mt-1 h-9 w-full rounded-lg border bg-white px-3 text-sm placeholder:italic placeholder:text-ink-300 focus:outline-none ${
                    isMissing
                      ? "border-amber-300 focus:border-amber-500"
                      : "border-ink-200 focus:border-ink-400"
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-ink-100 bg-ink-50/40 px-3 py-2.5 text-[11px] text-ink-600">
          <span className="demo-note mr-1.5">What happens on Add</span>
          The record is saved to local state, the picker auto-selects it, and step 3 (Confirm details) prefills these values into the intake form. Clause checks + routing fire against the same engine as any imported record. In production this also writes a "manual record" stub to the source system of record (so a Salesforce admin can later attach the deal if needed).
        </div>
      </div>
    </Modal>
  );
}
