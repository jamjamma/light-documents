"use client";

import { useState, useEffect } from "react";
import type { Template, SourceRecord, ContractFields } from "@/lib/types";
import { getSalaryBand, isAcceptedLaw } from "@/lib/policy-config";
import { formatEur } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

interface Props {
  template: Template;
  source: SourceRecord;
  onChange: (fields: ContractFields) => void;
}

export function IntakeForm({ template, source, onChange }: Props) {
  const [fields, setFields] = useState<ContractFields>(() => ({ ...source.data } as ContractFields));

  useEffect(() => {
    setFields({ ...source.data } as ContractFields);
  }, [source.id, source.data]);

  useEffect(() => {
    onChange(fields);
  }, [fields, onChange]);

  const update = (patch: Partial<ContractFields>) => setFields((prev) => ({ ...prev, ...patch }));

  if (template.type === "MSA") return <MsaForm fields={fields} update={update} isPilot={template.id === "msa_pilot_v1_0"} />;
  if (template.type === "Order Form") return <OrderFormIntake fields={fields} update={update} />;
  if (template.type === "NDA") return <NdaForm fields={fields} update={update} />;
  if (template.type === "Employment") return <EmploymentForm fields={fields} update={update} jurisdiction={template.id === "employment_uk_v1_0" ? "UK" : "DK"} />;
  if (template.type === "Warrant") return <WarrantForm fields={fields} update={update} />;
  return null;
}

// ── Field primitives ─────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  warning,
  children,
}: {
  label: string;
  hint?: string;
  warning?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-ink-700">{label}</span>
      <div className="mt-1">{children}</div>
      {warning && (
        <div className="mt-1 flex items-start gap-1 text-[11px] text-rose-500">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
      {hint && !warning && <div className="mt-1 text-[11px] text-ink-500">{hint}</div>}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
    />
  );
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput type="number" {...props} />;
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm focus:border-ink-400 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900/20"
      />
      <span className="text-ink-700">{label}</span>
    </label>
  );
}

function GridSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
      <legend className="demo-note mb-3">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

// ── MSA ──────────────────────────────────────────────────────────────────────

function MsaForm({ fields, update, isPilot }: { fields: ContractFields; update: (p: Partial<ContractFields>) => void; isPilot?: boolean }) {
  const arr = fields.contractValueEur ?? 0;
  const standardCap = isPilot ? 50_000 : 500_000;
  const standardTerm = isPilot ? 3 : 12;
  return (
    <div className="space-y-5">
      {isPilot && (
        <div className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-[12px] text-accent-800">
          <strong>Pilot template:</strong> 3-month term, €50k liability cap, no auto-renew. Designed for low-risk POCs. For longer or larger deals, switch to standard MSA.
        </div>
      )}
      <GridSection title="Counterparty">
        <Field label="Legal name">
          <TextInput value={fields.counterpartyLegalName ?? ""} onChange={(e) => update({ counterpartyLegalName: e.target.value })} />
        </Field>
        <Field label="Light entity">
          <Select
            value={fields.lightEntity ?? "Light ApS (Denmark)"}
            onChange={(v) => update({ lightEntity: v })}
            options={[
              { value: "Light ApS (Denmark)", label: "Light ApS (Denmark)" },
              { value: "Light Ltd (United Kingdom)", label: "Light Ltd (United Kingdom)" },
              { value: "Light Inc. (US Delaware)", label: "Light Inc. (US Delaware)" },
            ]}
          />
        </Field>
      </GridSection>

      <GridSection title="Commercial terms">
        <Field label={isPilot ? "Pilot value (EUR)" : "Contract value (ARR €)"} hint={isPilot ? undefined : arr >= 100_000 ? "Will require CFO approval (≥ €100k)." : arr >= 50_000 ? "Will require Head of Finance approval (≥ €50k)." : undefined}>
          <NumberInput value={arr} onChange={(e) => update({ contractValueEur: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Payment terms (days)" warning={(fields.paymentTermsDays ?? 30) > 30 ? `Non-standard: master is Net 30. Will route to Counsel.` : undefined}>
          <NumberInput value={fields.paymentTermsDays ?? 30} onChange={(e) => update({ paymentTermsDays: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Liability cap" warning={fields.liabilityCapUnlimited ? "Unlimited liability requires Counsel approval." : (fields.liabilityCapEur ?? standardCap) < standardCap ? `Cap below €${standardCap.toLocaleString()} is non-standard for this template.` : undefined}>
          <div className="flex items-center gap-3">
            <NumberInput
              value={fields.liabilityCapEur ?? standardCap}
              onChange={(e) => update({ liabilityCapEur: Number(e.target.value) || 0 })}
              disabled={fields.liabilityCapUnlimited === true}
            />
            <Toggle checked={fields.liabilityCapUnlimited === true} onChange={(v) => update({ liabilityCapUnlimited: v })} label="Unlimited" />
          </div>
        </Field>
        <Field label={isPilot ? "Pilot term (months)" : "Initial term (months)"} warning={isPilot && (fields.termMonths ?? 3) > 3 ? "Pilot fixed at 3 months." : undefined}>
          <NumberInput value={fields.termMonths ?? standardTerm} onChange={(e) => update({ termMonths: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Effective date">
          <TextInput type="date" value={fields.effectiveDate ?? ""} onChange={(e) => update({ effectiveDate: e.target.value })} />
        </Field>
        {isPilot && (
          <Field label="Auto-renew" warning={fields.autoRenew !== false ? "Pilots must not auto-renew. Customer should consciously commit via standard MSA." : undefined}>
            <Toggle checked={fields.autoRenew === false ? false : true} onChange={(v) => update({ autoRenew: v })} label="On" />
          </Field>
        )}
      </GridSection>

      <GridSection title="Legal">
        <Field label="Governing law" warning={!isAcceptedLaw(fields.governingLaw) ? "Non-EU and non-UK governing law requires Counsel review." : undefined}>
          <TextInput value={fields.governingLaw ?? "Denmark"} onChange={(e) => update({ governingLaw: e.target.value })} />
        </Field>
      </GridSection>

      <GridSection title="Counterparty signer">
        <Field label="Name">
          <TextInput value={fields.counterpartySignerName ?? ""} onChange={(e) => update({ counterpartySignerName: e.target.value })} />
        </Field>
        <Field label="Title">
          <TextInput value={fields.counterpartySignerTitle ?? ""} onChange={(e) => update({ counterpartySignerTitle: e.target.value })} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={fields.counterpartySignerEmail ?? ""} onChange={(e) => update({ counterpartySignerEmail: e.target.value })} />
        </Field>
      </GridSection>
    </div>
  );
}

// ── NDA ──────────────────────────────────────────────────────────────────────

function NdaForm({ fields, update }: { fields: ContractFields; update: (p: Partial<ContractFields>) => void }) {
  return (
    <div className="space-y-5">
      <GridSection title="Parties">
        <Field label="Counterparty legal name">
          <TextInput value={fields.counterpartyLegalName ?? ""} onChange={(e) => update({ counterpartyLegalName: e.target.value })} />
        </Field>
        <Field label="Light entity">
          <Select
            value={fields.lightEntity ?? "Light ApS (Denmark)"}
            onChange={(v) => update({ lightEntity: v })}
            options={[
              { value: "Light ApS (Denmark)", label: "Light ApS (Denmark)" },
              { value: "Light Ltd (United Kingdom)", label: "Light Ltd (United Kingdom)" },
              { value: "Light Inc. (US Delaware)", label: "Light Inc. (US Delaware)" },
            ]}
          />
        </Field>
        <Field label="Term (months)">
          <NumberInput value={fields.termMonths ?? 24} onChange={(e) => update({ termMonths: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Governing law" warning={!isAcceptedLaw(fields.governingLaw) ? "Non-EU and non-UK governing law requires Counsel review." : undefined}>
          <TextInput value={fields.governingLaw ?? "Denmark"} onChange={(e) => update({ governingLaw: e.target.value })} />
        </Field>
      </GridSection>

      <GridSection title="Counterparty signer">
        <Field label="Name">
          <TextInput value={fields.counterpartySignerName ?? ""} onChange={(e) => update({ counterpartySignerName: e.target.value })} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={fields.counterpartySignerEmail ?? ""} onChange={(e) => update({ counterpartySignerEmail: e.target.value })} />
        </Field>
      </GridSection>
    </div>
  );
}

function OrderFormIntake({ fields, update }: { fields: ContractFields; update: (p: Partial<ContractFields>) => void }) {
  const total = fields.orderTotalEur ?? 0;
  return (
    <div className="space-y-5">
      <GridSection title="Customer + MSA reference">
        <Field label="Customer legal name">
          <TextInput value={fields.counterpartyLegalName ?? ""} onChange={(e) => update({ counterpartyLegalName: e.target.value })} />
        </Field>
        <Field label="Light entity">
          <Select
            value={fields.lightEntity ?? "Light ApS (Denmark)"}
            onChange={(v) => update({ lightEntity: v })}
            options={[
              { value: "Light ApS (Denmark)", label: "Light ApS (Denmark)" },
              { value: "Light Ltd (United Kingdom)", label: "Light Ltd (United Kingdom)" },
              { value: "Light Inc. (US Delaware)", label: "Light Inc. (US Delaware)" },
            ]}
          />
        </Field>
        <Field
          label="Reference MSA ID"
          warning={!fields.referenceMsaId ? "Required. Order Form must reference an executed MSA." : undefined}
          hint={fields.referenceMsaId ? `Will link Order Form to ${fields.referenceMsaId} in Light ledger.` : undefined}
        >
          <TextInput value={fields.referenceMsaId ?? ""} placeholder="e.g. MSA-Acme-2026-001" onChange={(e) => update({ referenceMsaId: e.target.value })} />
        </Field>
        <Field label="Effective date">
          <TextInput type="date" value={fields.effectiveDate ?? ""} onChange={(e) => update({ effectiveDate: e.target.value })} />
        </Field>
      </GridSection>

      <GridSection title="Order">
        <Field label="Order total (EUR)" hint={total >= 100_000 ? "Will require CFO approval (≥ €100k)." : total >= 25_000 ? "Will route to Head of Finance & Ops (≥ €25k)." : undefined}>
          <NumberInput value={total} onChange={(e) => update({ orderTotalEur: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Seat count (if applicable)">
          <NumberInput value={fields.seatCount ?? 0} onChange={(e) => update({ seatCount: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Billing frequency">
          <Select
            value={fields.billingFrequency ?? "annual"}
            onChange={(v) => update({ billingFrequency: v as ContractFields["billingFrequency"] })}
            options={[
              { value: "annual", label: "Annual upfront" },
              { value: "quarterly", label: "Quarterly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </Field>
        <Field label="Payment terms (days)" warning={(fields.paymentTermsDays ?? 30) > 30 ? "Net > 30 requires Finance review." : undefined}>
          <NumberInput value={fields.paymentTermsDays ?? 30} onChange={(e) => update({ paymentTermsDays: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Order term (months)">
          <NumberInput value={fields.termMonths ?? 12} onChange={(e) => update({ termMonths: Number(e.target.value) || 0 })} />
        </Field>
      </GridSection>

      <GridSection title="Counterparty signer">
        <Field label="Name">
          <TextInput value={fields.counterpartySignerName ?? ""} onChange={(e) => update({ counterpartySignerName: e.target.value })} />
        </Field>
        <Field label="Title">
          <TextInput value={fields.counterpartySignerTitle ?? ""} onChange={(e) => update({ counterpartySignerTitle: e.target.value })} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={fields.counterpartySignerEmail ?? ""} onChange={(e) => update({ counterpartySignerEmail: e.target.value })} />
        </Field>
      </GridSection>
    </div>
  );
}

// ── Employment ──────────────────────────────────────────────────────────────

function EmploymentForm({ fields, update, jurisdiction = "DK" }: { fields: ContractFields; update: (p: Partial<ContractFields>) => void; jurisdiction?: "DK" | "UK" }) {
  const band = getSalaryBand(fields.role, jurisdiction);
  const salary = fields.salaryEur ?? 0;
  const aboveBand = band && salary > band.max;
  const isUk = jurisdiction === "UK";
  return (
    <div className="space-y-5">
      <div className={`rounded-lg border px-3 py-2 text-[12px] ${isUk ? "border-blue-200 bg-blue-50 text-blue-800" : "border-teal-200 bg-teal-50 text-teal-800"}`}>
        <strong>{isUk ? "UK template:" : "Denmark template:"}</strong>{" "}
        {isUk
          ? "England & Wales jurisdiction. 28 days statutory holiday + 5 Light days. Auto-enrolment pension. Notice tied to length of service. Used for Light Ltd hires."
          : "Danish Funktionærloven (Salaried Employees Act). 25 statutory holidays + 5 Light days. 1-month standard notice. 37-hour week. Used for Light ApS hires."}
      </div>
      <GridSection title="Candidate">
        <Field label="Full name">
          <TextInput value={fields.candidateName ?? ""} onChange={(e) => update({ candidateName: e.target.value })} />
        </Field>
        <Field label="Role">
          <TextInput value={fields.role ?? ""} onChange={(e) => update({ role: e.target.value })} />
        </Field>
        <Field label="Manager">
          <TextInput value={fields.manager ?? ""} onChange={(e) => update({ manager: e.target.value })} />
        </Field>
        <Field label="Start date">
          <TextInput type="date" value={fields.startDate ?? ""} onChange={(e) => update({ startDate: e.target.value })} />
        </Field>
      </GridSection>

      <GridSection title="Compensation">
        <Field
          label="Base salary (€ annual)"
          warning={aboveBand ? `Above band for ${fields.role} (max ${formatEur(band.max)}). Will require CFO approval.` : undefined}
          hint={band && !aboveBand ? `In band for ${fields.role}: ${formatEur(band.min)} to ${formatEur(band.max)}` : undefined}
        >
          <NumberInput value={salary} onChange={(e) => update({ salaryEur: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Variable %" hint={(fields.role ?? "").toLowerCase().includes("sales") ? "Sales standard: up to 50% variable" : "Non-sales standard: 0% variable"}>
          <NumberInput value={fields.variablePct ?? 0} onChange={(e) => update({ variablePct: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Equity grant (basis points)" hint={(fields.equityBps ?? 0) > 0 ? "Equity grant included. Will require CEO sign-off." : undefined}>
          <NumberInput value={fields.equityBps ?? 0} onChange={(e) => update({ equityBps: Number(e.target.value) || 0 })} />
        </Field>
      </GridSection>

      <GridSection title="Terms">
        <Field label={`Probation (months)`} hint={isUk ? "UK standard: 3-6 months. Statutory protections kick in after." : "Danish standard: 3 months under Funktionærloven."}>
          <NumberInput value={fields.probationMonths ?? (isUk ? 6 : 3)} onChange={(e) => update({ probationMonths: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Work location">
          <TextInput value={fields.workLocation ?? (isUk ? "London (hybrid)" : "Copenhagen (hybrid)")} onChange={(e) => update({ workLocation: e.target.value })} />
        </Field>
      </GridSection>
    </div>
  );
}

// ── Warrant ─────────────────────────────────────────────────────────────────

function WarrantForm({ fields, update }: { fields: ContractFields; update: (p: Partial<ContractFields>) => void }) {
  return (
    <div className="space-y-5">
      <GridSection title="Grant">
        <Field label="Stakeholder">
          <TextInput value={fields.stakeholderName ?? ""} onChange={(e) => update({ stakeholderName: e.target.value })} />
        </Field>
        <Field label="Warrant percentage">
          <NumberInput value={fields.warrantPct ?? 0} step={0.01} onChange={(e) => update({ warrantPct: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Vesting (months)">
          <NumberInput value={fields.vestingMonths ?? 48} onChange={(e) => update({ vestingMonths: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Cliff (months)">
          <NumberInput value={fields.cliffMonths ?? 12} onChange={(e) => update({ cliffMonths: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Board resolution ref" warning={!fields.boardResolutionRef ? "Required before send. Block until set." : undefined}>
          <TextInput value={fields.boardResolutionRef ?? ""} placeholder="e.g. BR-2026-Q2-007" onChange={(e) => update({ boardResolutionRef: e.target.value })} />
        </Field>
      </GridSection>
    </div>
  );
}

