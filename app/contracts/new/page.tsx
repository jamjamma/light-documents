"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TemplatePicker } from "@/components/TemplatePicker";
import { RecordPicker } from "@/components/RecordPicker";
import { IntakeForm } from "@/components/IntakeForm";
import { DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { createContract, runClauseChecks } from "@/lib/contract-store";
import { getTemplate } from "@/lib/mock-data";
import type { Template, SourceRecord, ContractFields } from "@/lib/types";
import { ArrowLeft, ArrowRight, Check, FileType2, Database, FormInput, Pencil } from "lucide-react";
import clsx from "clsx";

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 1, label: "Template", icon: <FileType2 className="h-3.5 w-3.5" /> },
  { id: 2, label: "Source record", icon: <Database className="h-3.5 w-3.5" /> },
  { id: 3, label: "Confirm details", icon: <FormInput className="h-3.5 w-3.5" /> },
];

export default function NewContractPage() {
  return (
    <Suspense fallback={<Header title="New contract" subtitle="Loading…" />}>
      <NewContractInner />
    </Suspense>
  );
}

function NewContractInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [template, setTemplate] = useState<Template | null>(null);
  const [source, setSource] = useState<SourceRecord | null>(null);
  const [fields, setFields] = useState<ContractFields>({});

  // Read ?template=<id> from the URL once on mount. If a known template id is
  // present, prefill the template and advance to step 2 so users coming from
  // the templates page or a "Use this template" CTA skip the picker.
  useEffect(() => {
    const requested = searchParams.get("template");
    if (!requested) return;
    const t = getTemplate(requested);
    if (t) {
      setTemplate(t);
      setStep(2);
    }
  }, [searchParams]);

  useEffect(() => {
    // when source changes, reset fields to source data
    if (source) setFields({ ...source.data } as ContractFields);
  }, [source]);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRunChecks = () => {
    if (!template || !source) return;
    setSubmitError(null);
    try {
      const contract = createContract({
        templateId: template.id,
        sourceRecordId: source.id,
        owner: ownerForType(template),
        ownerTeam: ownerTeamForType(template),
        fields,
      });
      runClauseChecks(contract.id);
      router.push(`/contracts/${contract.id}`);
    } catch (err: unknown) {
      // Surface failures instead of letting the click silently no-op. Common
      // causes: source record not found (e.g. localStorage cleared between
      // selection and submit), template lookup failure, or a clause rule
      // throwing on a malformed field.
      const message = err instanceof Error ? err.message : "Unexpected error";
      setSubmitError(message);
    }
  };

  return (
    <>
      <Header
        title="New contract"
        subtitle="Pick template, pick record, confirm details. Word and DocuSign stay where they are."
        breadcrumb={[
          { label: "Dashboard", href: "/" },
          { label: "New contract" },
        ]}
      />
      <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <Card>
          <div className="tour-anchor-intake-steps">
            <Stepper step={step} onJump={(s) => setStep(s)} canJumpTo={canJumpTo(step, !!template, !!source)} />
          </div>
        </Card>

        <div className="mt-4">
          {step === 1 && (
            <Card title="Choose a template" subtitle="Master Word documents synced from Drive. Each has typed clause rules.">
              <div className="tour-anchor-intake-template-picker">
                <TemplatePicker selected={template} onSelect={(t) => { setTemplate(t); setStep(2); }} />
              </div>
            </Card>
          )}

          {step === 2 && template && (
            <Card
              title={`Pick a source record for: ${template.name}`}
              subtitle="Records pulled from connected CRM, HRIS, or added manually. Variables prefill automatically."
              actions={<Button variant="ghost" size="sm" onClick={() => setStep(1)} leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />}>Back</Button>}
            >
              <div className="tour-anchor-intake-record-picker">
                <RecordPicker template={template} selected={source} onSelect={(r) => { setSource(r); setStep(3); }} />
              </div>
            </Card>
          )}

          {step === 3 && template && source && (
            <div className="space-y-3">
              <SourceContextBar template={template} source={source} onChangeSource={() => setStep(2)} onChangeTemplate={() => setStep(1)} />
              <Card
                title="Confirm details"
                subtitle="Form prefilled from the source record. Adjust anything non-standard. Warnings appear inline as you type."
                actions={
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setStep(2)} leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />}>Back</Button>
                    <Button onClick={handleRunChecks} trailingIcon={<ArrowRight className="h-3.5 w-3.5" />} className="tour-anchor-intake-runchecks">Run checks</Button>
                  </div>
                }
              >
                <div className="tour-anchor-intake-form">
                <IntakeForm template={template} source={source} onChange={setFields} />
                </div>
                {submitError && (
                  <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
                    <strong>Could not run checks:</strong> {submitError}
                  </div>
                )}
                <div className="mt-5 space-y-2">
                  <div className="rounded-lg border border-ink-200 bg-ink-50/40 px-4 py-3 text-[11px] text-ink-500">
                    <span className="demo-note mr-2">Demo</span>
                    Clicking "Run checks" creates the contract record and runs the deterministic clause rules engine against the master template. In production this also calls Claude for natural-language clause comparison.
                  </div>
                  <div className="rounded-lg border border-ink-100 bg-white px-4 py-3 text-[11px] text-ink-600">
                    <span className="demo-note mr-2">How adjustments work</span>
                    Variable changes go through this form (no Word edits, no broken templates). Non-standard terms (e.g., Net 60, modified liability) trigger Legal review automatically. For full bespoke redlines, switch to the Bespoke lane: download the doc, edit in Word with track changes, upload back, AI diffs vs master and routes to Legal. Either way the master template stays untouched and the chain of custody is logged.
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function canJumpTo(currentStep: Step, hasTemplate: boolean, hasSource: boolean): Set<Step> {
  const set = new Set<Step>();
  set.add(1);
  if (hasTemplate) set.add(2);
  if (hasTemplate && hasSource) set.add(3);
  // also always allow current
  set.add(currentStep);
  return set;
}

function Stepper({ step, onJump, canJumpTo }: { step: Step; onJump: (s: Step) => void; canJumpTo: Set<Step> }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((s, i) => {
        const status: "done" | "active" | "todo" = s.id < step ? "done" : s.id === step ? "active" : "todo";
        const clickable = canJumpTo.has(s.id);
        return (
          <div key={s.id} className="flex flex-1 items-center">
            <button
              onClick={() => clickable && onJump(s.id)}
              disabled={!clickable}
              className={clsx(
                "group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors",
                clickable ? "cursor-pointer hover:bg-ink-50" : "cursor-not-allowed",
              )}
            >
              <span
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
                  status === "done" && "bg-sage-500 text-white",
                  status === "active" && "bg-ink-900 text-white",
                  status === "todo" && "bg-ink-100 text-ink-500",
                )}
              >
                {status === "done" ? <Check className="h-3 w-3" /> : s.id}
              </span>
              <span className={clsx("text-[12px] font-medium", status === "active" ? "text-ink-900" : "text-ink-500")}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={clsx("mx-3 h-px flex-1", status === "done" ? "bg-sage-500" : "bg-ink-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SourceContextBar({
  template,
  source,
  onChangeSource,
  onChangeTemplate,
}: {
  template: Template;
  source: SourceRecord;
  onChangeSource: () => void;
  onChangeTemplate: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-2.5 shadow-card">
      <DocumentTypeIcon type={template.type} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[13px] font-semibold text-ink-900">{template.name}</span>
          <span className="font-mono text-[11px] text-ink-500">{template.version}</span>
          <span className="text-ink-400">·</span>
          <span className="text-[13px] text-ink-800">{source.display}</span>
          <span className="text-[11px] text-ink-500">via {source.system}{source.externalRef ? ` ${source.externalRef}` : ""}</span>
        </div>
        <div className="text-[11px] text-ink-500">{source.subtitle}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onChangeTemplate}
          className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-[11px] text-ink-700 hover:bg-ink-50"
        >
          <Pencil className="h-3 w-3" /> template
        </button>
        <button
          onClick={onChangeSource}
          className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-[11px] text-ink-700 hover:bg-ink-50"
        >
          <Pencil className="h-3 w-3" /> source
        </button>
      </div>
    </div>
  );
}

function ownerForType(template: Template): string {
  if (template.type === "Employment") return "Pia Andersen";
  if (template.type === "Warrant") return "Magnus Karlsson";
  return "Tom Bauer";
}

function ownerTeamForType(template: Template): string {
  if (template.type === "Employment") return "People Ops";
  if (template.type === "Warrant") return "Finance";
  return "Sales";
}
