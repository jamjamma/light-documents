"use client";

import { useEffect, useState } from "react";
import { readTourState, TOUR_STEPS } from "@/lib/tour-steps";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { formatEur, formatDate, initials } from "@/lib/format";
import type { Contract, Template } from "@/lib/types";
import { resolveSigners, type SignerDef } from "@/lib/signer-routing";
import {
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Mail,
  ShieldCheck,
  Save,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  contract: Contract;
  template: Template;
  onSend: () => Promise<void>;
  /**
   * Park the contract at its current stage and exit. Mirrors the
   * Save-draft-and-exit action on the contract detail page so the operator
   * can step away from inside the modal without first closing it.
   */
  onSaveDraft?: () => void;
  /**
   * True only when the approval chain is fully satisfied and the contract is
   * ready to send. When false the modal still opens (so the operator can
   * inspect the populated envelope) but the Send button is disabled.
   */
  canSend: boolean;
}

const SIDE_COLOR: Record<SignerDef["side"], { bg: string; ring: string; text: string; tab: string; tabText: string }> = {
  counterparty: { bg: "bg-amber-50", ring: "ring-amber-300", text: "text-amber-800", tab: "bg-amber-300", tabText: "text-amber-950" },
  light: { bg: "bg-sky-50", ring: "ring-sky-300", text: "text-sky-800", tab: "bg-sky-300", tabText: "text-sky-950" },
  witness: { bg: "bg-purple-50", ring: "ring-purple-300", text: "text-purple-800", tab: "bg-purple-300", tabText: "text-purple-950" },
};

export function DocuSignPreviewModal({ open, onClose, contract, template, onSend, onSaveDraft, canSend }: Props) {
  const [sending, setSending] = useState(false);
  const [showApi, setShowApi] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = template.type === "NDA" ? 4 : template.type === "Order Form" ? 4 : 6;
  const signers = resolveSigners(contract, template);
  const envelopeId = contract.envelopeId ?? "DS-XXXXX (preview)";
  const subject = `Please sign: ${contract.name}`;
  const pendingApprovals = (contract.approvals ?? []).filter((a) => a.status === "pending").length;

  const handleSend = async () => {
    setSending(true);
    await onSend();
    setSending(false);
  };

  // Auto-advance the tour when the operator pages through to the signature
  // page. The `modal-pagenav` step hides its Next button; reaching the last
  // page is the only forward path. Idempotent: only fires if the current
  // tour step is `modal-pagenav` at the moment the user lands on the last
  // page.
  useEffect(() => {
    if (!open) return;
    if (page !== totalPages) return;
    const state = readTourState();
    if (!state.active) return;
    const step = TOUR_STEPS[state.stepIndex];
    if (step?.id !== "modal-pagenav") return;
    window.dispatchEvent(
      new CustomEvent("tour:auto-next", { detail: { fromStepId: "modal-pagenav" } }),
    );
  }, [open, page, totalPages]);

  // (modal-pagenav now anchors on the whole PageNav container, not the
  // active page button, so no re-anchor is needed as the user pages
  // through. driver.js's refresh on resize covers any layout shift.)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-yellow-400 text-[10px] font-bold text-yellow-950">DS</div>
          <span>DocuSign envelope preview</span>
          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-mono text-ink-600">{envelopeId}</span>
        </div>
      }
      subtitle={
        <span>
          <strong>Subject:</strong> {subject}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => setShowApi((s) => !s)}>
            {showApi ? "Hide" : "Show"} API call
          </Button>
          {onSaveDraft && (
            <Button
              variant="ghost"
              leadingIcon={<Save className="h-3.5 w-3.5" />}
              onClick={onSaveDraft}
              disabled={sending}
              title="Park this contract at its current stage and return to the dashboard. Auto-save is already on; this also writes a 'stepped away' audit event."
            >
              Save draft &amp; exit
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={sending}>Close</Button>
          <Button
            onClick={handleSend}
            leadingIcon={sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            disabled={sending || !canSend}
            title={!canSend ? `Send blocked until all approvals complete (${pendingApprovals} pending).` : undefined}
            className="tour-anchor-modal-send"
          >
            {sending ? "Creating envelope..." : "Send via DocuSign"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <RecipientSidebar signers={signers} template={template} />
        <div className="space-y-3">
          {!canSend && (
            <div className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-[12px] text-ink-700">
              <strong>Send blocked.</strong> {pendingApprovals} approval(s) still pending. You can inspect the populated envelope here, but the Send button stays disabled until the approval chain is complete.
            </div>
          )}
          <div className="tour-anchor-modal-document">
            <DocumentPage
              page={page}
              totalPages={totalPages}
              contract={contract}
              template={template}
              signers={signers}
            />
          </div>
          <div className="tour-anchor-modal-pagenav">
            <PageNav page={page} totalPages={totalPages} onChange={setPage} />
          </div>
          <div className="tour-anchor-modal-anchortags">
            <AnchorTagBar template={template} />
          </div>
          {showApi && <ApiCallPreview contract={contract} template={template} signers={signers} />}
        </div>
      </div>
    </Modal>
  );
}

// ── Recipient sidebar ────────────────────────────────────────────────────────

function RecipientSidebar({ signers, template }: { signers: SignerDef[]; template: Template }) {
  return (
    <aside className="space-y-3">
      <div className="tour-anchor-modal-recipients">
        <div className="demo-note mb-2">Recipients ({signers.length})</div>
        <ol className="space-y-2">
          {signers.map((s) => {
            const color = SIDE_COLOR[s.side];
            return (
              <li key={s.routingOrder} className={`rounded-lg p-2.5 ring-1 ring-inset ${color.bg} ${color.ring}`}>
                <div className="flex items-start gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${color.tab} ${color.tabText}`}>
                    {s.routingOrder}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[12px] font-semibold ${color.text}`}>{s.name}</div>
                    <div className="truncate text-[11px] text-ink-600">{s.title ?? s.roleName}</div>
                    <div className="truncate text-[10px] text-ink-500">{s.email}</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ink-500">
                  <Clock className="h-3 w-3" /> queued · routing #{s.routingOrder}
                </div>
                {s.selectionReason && (
                  <div className="mt-1 text-[10px] leading-tight text-ink-500">
                    <span className="font-medium text-ink-600">Why:</span> {s.selectionReason}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <details className="tour-anchor-modal-config group rounded-lg border border-ink-100 bg-white p-3 text-[11px]">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-medium text-ink-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="demo-note">Envelope configuration</span>
            <span className="text-ink-500">audit view</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-ink-400 group-open:hidden">Expand</span>
          <span className="hidden text-[10px] uppercase tracking-wider text-ink-400 group-open:inline">Collapse</span>
        </summary>
        <ul className="mt-2 space-y-1 text-ink-700">
          <li className="text-ink-600">Expiry: {template.docusignFeatures.expiryDays ?? 14} days</li>
          <li className="text-ink-600">Reminders: day {template.docusignFeatures.reminderDays?.join(", ") ?? "3, 7"}</li>
          <li className="text-ink-600">Routing: {template.docusignFeatures.signingOrder ?? "sequential"}</li>
          {template.docusignFeatures.qesRequired && (
            <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-sage-500" />eIDAS QES verification</li>
          )}
          {template.docusignFeatures.smsVerification && (
            <li className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-blue-500" />SMS OTP identity check</li>
          )}
          {template.docusignFeatures.witnessRequired && (
            <li className="flex items-center gap-1.5"><Eye className="h-3 w-3 text-purple-500" />Witness signer required</li>
          )}
          {template.docusignFeatures.powerFormCapable && (
            <li className="text-ink-600">PowerForm capable</li>
          )}
          {template.docusignFeatures.bulkSendCapable && (
            <li className="text-ink-600">Bulk Send capable</li>
          )}
        </ul>
      </details>

      <div className="rounded-lg border border-ink-100 bg-ink-50/40 p-2.5 text-[10px] text-ink-500">
        <span className="demo-note mr-1">Demo</span>
        The Legal team placed anchor tags in the master template once. DocuSign API finds them via <span className="font-mono">searchString</span>.
      </div>
    </aside>
  );
}

// ── Document page (the "PDF preview") ─────────────────────────────────────────

function DocumentPage({
  page,
  totalPages,
  contract,
  template,
  signers,
}: {
  page: number;
  totalPages: number;
  contract: Contract;
  template: Template;
  signers: SignerDef[];
}) {
  return (
    <div className="rounded-xl border border-ink-300 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50/60 px-4 py-2 text-[11px]">
        <div className="font-mono text-ink-500">{contract.id}.docx · {contract.name}</div>
        <div className="text-ink-600">Page {page} of {totalPages}</div>
      </div>
      <div className="min-h-[480px] px-10 py-8 font-serif text-[13px] leading-relaxed text-ink-800">
        <PageBody page={page} totalPages={totalPages} contract={contract} template={template} signers={signers} />
      </div>
    </div>
  );
}

function PageBody({
  page,
  totalPages,
  contract,
  template,
  signers,
}: {
  page: number;
  totalPages: number;
  contract: Contract;
  template: Template;
  signers: SignerDef[];
}) {
  const f = contract.fields;
  const isLast = page === totalPages;

  // ── Signature page ────────────────────────────────────────────────────
  if (isLast) {
    return (
      <div className="space-y-4 font-sans">
        <div>
          <div className="text-center text-[16px] font-semibold tracking-tight">SIGNATURES</div>
          <div className="mt-1 text-center text-[10px] uppercase tracking-widest text-ink-500">
            Page {page} of {totalPages}
          </div>
        </div>
        <p className="text-[12px] text-ink-700">
          By signing below, each party agrees to be bound by the terms of this {template.formalName ?? template.name}. Each party warrants
          authority to sign on behalf of the entity named.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {signers.map((s) => (
            <SignatureBlock key={s.routingOrder} signer={s} />
          ))}
        </div>
        <div className="mt-6 rounded-md border border-dashed border-ink-200 bg-ink-50/40 p-3 text-[10px] text-ink-500">
          <span className="demo-note mr-1.5">Anchor tags</span>
          {template.anchorTags.join("  ")}
        </div>
      </div>
    );
  }

  // ── Page 1: Parties, Recitals ─────────────────────────────────────────
  if (page === 1) {
    return (
      <div className="space-y-4 font-sans">
        <div className="text-center">
          <div className="text-[18px] font-semibold tracking-tight">{(template.formalName ?? template.name).toUpperCase()}</div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-ink-500">
            {template.version} · {f.lightEntity ?? "Light ApS"}
          </div>
        </div>
        <div className="rounded-md bg-ink-50/40 px-3 py-2 text-[11px] text-ink-500">
          <strong className="text-ink-700">Effective date:</strong> {formatDate(f.effectiveDate)} · <strong className="text-ink-700">Page {page} of {totalPages}</strong>
        </div>
        <Section heading="1. PARTIES">
          This Agreement is entered into between{" "}
          <Var value={f.counterpartyLegalName ?? f.disclosingParty ?? f.vendorName ?? f.candidateName ?? f.stakeholderName ?? "Counterparty"} />{" "}
          ("{template.type === "Employment" ? "Employee" : template.type === "Warrant" ? "Stakeholder" : "Customer"}") and{" "}
          <Var value={f.lightEntity ?? "Light ApS"} /> ("Light").
        </Section>
        <Section heading="2. RECITALS">
          {template.type === "MSA" && <>WHEREAS, Customer wishes to procure software-as-a-service from Light; AND WHEREAS, Light wishes to provide such services on the terms and conditions herein, the parties agree as follows.</>}
          {template.type === "Order Form" && (
            <>This Order Form is governed by and incorporated into the Master Services Agreement referenced as <Var value={f.referenceMsaId ?? "[MSA reference required]"} />. In the event of conflict between this Order Form and the MSA, the MSA shall prevail except as expressly modified herein.</>
          )}
          {template.type === "NDA" && (
            <>WHEREAS, the parties may exchange Confidential Information in connection with a potential business relationship; AND WHEREAS, each party agrees to maintain the confidentiality of such information, the parties agree as follows.</>
          )}
          {template.type === "Employment" && (
            <>Light hereby offers <Var value={f.candidateName ?? ""} /> employment in the role of <Var value={f.role ?? ""} />, on the terms set out in this Agreement, subject to the Funktionærloven (Danish Salaried Employees Act).</>
          )}
          {template.type === "Warrant" && (
            <>Light hereby grants <Var value={f.stakeholderName ?? ""} /> a warrant entitling the holder to subscribe for new shares of Light ApS on the terms set out in this Agreement, subject to Board Resolution <Var value={f.boardResolutionRef ?? "[pending]"} />.</>
          )}
        </Section>
        <Section heading="3. DEFINITIONS">
          "Confidential Information" means any non-public information disclosed by one party to the other, whether oral, written, or in any other form. [Definitions continue as in master template.]
        </Section>
      </div>
    );
  }

  // ── Page 2: Commercial / Scope ──────────────────────────────────────
  if (page === 2) {
    return (
      <div className="space-y-4 font-sans">
        <div className="text-center text-[10px] uppercase tracking-widest text-ink-500">Page {page} of {totalPages}</div>
        {template.type === "MSA" && (
          <>
            <Section heading="4. COMMERCIAL TERMS">
              The annual contract value is <Var value={formatEur(f.contractValueEur)} /> payable <Var value={`Net ${f.paymentTermsDays ?? 30}`} />. The initial term is{" "}
              <Var value={`${f.termMonths ?? 12} months`} />, with auto-renewal {f.autoRenew !== false ? "enabled" : "disabled"} on the terms in Section 9.
            </Section>
            <Section heading="5. SERVICES">
              Light shall provide the services described in Exhibit A (Service Description) in accordance with the service levels in Exhibit B (Service Level Agreement).
            </Section>
            <Section heading="6. DATA PROCESSING">
              To the extent Light processes personal data on behalf of Customer, the parties shall comply with the Data Processing Agreement attached as Exhibit C, incorporating the EU Standard Contractual Clauses (Module 2: Controller-to-Processor).
            </Section>
          </>
        )}
        {template.type === "Order Form" && (
          <>
            <Section heading="4. ORDER DETAILS">
              <div className="mt-2 overflow-hidden rounded border border-ink-200 text-[12px]">
                <table className="w-full">
                  <thead className="bg-ink-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-left">Qty</th>
                      <th className="px-3 py-2 text-right">Unit price</th>
                      <th className="px-3 py-2 text-right">Total (EUR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    <tr>
                      <td className="px-3 py-2">Light Platform, Pro tier</td>
                      <td className="px-3 py-2">{f.seatCount ?? 10} seats</td>
                      <td className="px-3 py-2 text-right">€{Math.round((f.orderTotalEur ?? 0) / Math.max(1, f.seatCount ?? 10))}</td>
                      <td className="px-3 py-2 text-right">{formatEur(f.orderTotalEur)}</td>
                    </tr>
                    <tr className="bg-ink-50/60 font-semibold">
                      <td className="px-3 py-2" colSpan={3}>Total</td>
                      <td className="px-3 py-2 text-right">{formatEur(f.orderTotalEur)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>
            <Section heading="5. BILLING">
              Billing frequency: <Var value={f.billingFrequency ?? "annual"} />. Payment terms: <Var value={`Net ${f.paymentTermsDays ?? 30}`} />. First invoice on the Effective Date.
            </Section>
            <Section heading="6. ORDER TERM">
              This Order Form is for <Var value={`${f.termMonths ?? 12} months`} /> beginning on the Effective Date. Renewal terms are governed by the referenced MSA.
            </Section>
          </>
        )}
        {template.type === "NDA" && (
          <>
            <Section heading="4. CONFIDENTIAL INFORMATION">
              "Confidential Information" includes business plans, technical data, financial information, customer lists, trade secrets, and any other proprietary information of the disclosing party. Excluded: information that is publicly available, independently developed, or rightfully obtained from a third party.
            </Section>
            <Section heading="5. OBLIGATIONS">
              The Receiving Parties shall: (a) maintain all Confidential Information in strict confidence; (b) use such information solely for the Purpose; (c) limit disclosure to employees with a need to know; (d) protect the information with the same degree of care used to protect its own confidential information, but not less than reasonable care.
            </Section>
            <Section heading="6. TERM">
              This Agreement shall remain in effect for <Var value={`${f.termMonths ?? 24} months`} /> from the Effective Date. Obligations of confidentiality shall survive termination.
            </Section>
          </>
        )}
        {template.type === "Employment" && (
          <>
            <Section heading="4. POSITION AND DUTIES">
              The Employee shall serve as <Var value={f.role ?? ""} />, reporting to <Var value={f.manager ?? "[Manager]"} />, and shall perform such duties as are customary for the role.
            </Section>
            <Section heading="5. COMPENSATION">
              Annual base salary: <Var value={formatEur(f.salaryEur)} /> payable monthly in arrears. Variable compensation: <Var value={`${f.variablePct ?? 0}%`} /> of base, structured per the Commission Plan Exhibit (if applicable). Holiday entitlement: 25 statutory days plus 5 Light days.
            </Section>
            <Section heading="6. START DATE AND PROBATION">
              Start date: <Var value={formatDate(f.startDate)} />. Probation period: <Var value={`${f.probationMonths ?? 3} months`} />, during which either party may terminate with 14 days notice. Notice period thereafter: 1 month (Funktionærloven).
            </Section>
          </>
        )}
        {template.type === "Warrant" && (
          <>
            <Section heading="4. GRANT">
              Light hereby grants the Holder a warrant entitling the Holder to subscribe for new shares of Light ApS equivalent to{" "}
              <Var value={`${f.warrantPct ?? 0}% of fully diluted equity`} /> as of the Effective Date.
            </Section>
            <Section heading="5. VESTING">
              The warrant shall vest over <Var value={`${f.vestingMonths ?? 48} months`} /> with a <Var value={`${f.cliffMonths ?? 12}-month cliff`} />, vesting monthly in equal portions thereafter. Unvested warrants are forfeited on termination of the Holder's relationship with Light.
            </Section>
            <Section heading="6. EXERCISE">
              The warrant may be exercised in whole or in part at any time after vesting, prior to expiration. Exercise price per share is set at the 409A valuation in Exhibit B.
            </Section>
          </>
        )}
      </div>
    );
  }

  // ── Pages 3+ : Standard clauses ───────────────────────────────────────
  return (
    <div className="space-y-4 font-sans">
      <div className="text-center text-[10px] uppercase tracking-widest text-ink-500">Page {page} of {totalPages}</div>
      <Section heading={`${page + 4}. ${page === 3 ? "REPRESENTATIONS AND WARRANTIES" : page === 4 ? "LIMITATION OF LIABILITY" : "GENERAL PROVISIONS"}`}>
        {page === 3 && (
          <>
            Each party represents and warrants that: (a) it is duly organised and validly existing under the laws of its jurisdiction; (b) it has full power and authority to enter into this Agreement; (c) the execution and performance of this Agreement do not breach any other agreement to which it is a party; (d) it shall comply with all applicable laws and regulations.
          </>
        )}
        {page === 4 && template.type === "MSA" && (
          <>
            Each party's aggregate liability under this Agreement shall not exceed <Var value={f.liabilityCapUnlimited ? "[Unlimited - non-standard, requires Legal review]" : formatEur(f.liabilityCapEur)} />. Indemnity: <Var value={(f.indemnity ?? "mutual").replace("_", "-")} />. Neither party shall be liable for indirect, consequential, or punitive damages except in cases of gross negligence or wilful misconduct.
          </>
        )}
        {page === 4 && template.type !== "MSA" && (
          <>
            Neither party shall be liable for indirect, consequential, or punitive damages except in cases of gross negligence or wilful misconduct. Direct damages are capped at the fees paid under this Agreement in the 12 months preceding the claim.
          </>
        )}
        {page === 5 && (
          <>
            <strong>Governing law.</strong> This Agreement is governed by the laws of <Var value={f.governingLaw ?? "Denmark"} />, excluding its conflict of laws provisions. <strong>Notices.</strong> Notices shall be delivered to the addresses set forth above by registered mail or recognised courier. <strong>Entire agreement.</strong> This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements relating to its subject matter.
          </>
        )}
      </Section>
      <p className="text-[11px] text-ink-500 italic">
        [Sections continue as in the master template. Clauses {page * 2 + 1} through {page * 2 + 4} omitted from this preview.]
      </p>
    </div>
  );
}

// ── Page primitives ───────────────────────────────────────────────────────────

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-900">{heading}</div>
      <div className="mt-1.5 text-[12.5px] text-ink-700">{children}</div>
    </div>
  );
}

function Var({ value }: { value: string }) {
  return (
    <span className="rounded bg-accent-50 px-1 py-0.5 text-[11px] font-medium text-accent-700 ring-1 ring-inset ring-accent-200">
      {value || "[blank]"}
    </span>
  );
}

function SignatureBlock({ signer }: { signer: SignerDef }) {
  const c = SIDE_COLOR[signer.side];
  return (
    <div className="space-y-2.5">
      <div className="text-[10px] uppercase tracking-widest text-ink-500">{signer.roleName}</div>
      <SignatureField label="Signature" type="sig" signer={signer} />
      <SignatureField label="Date" type="date" signer={signer} />
      <NamedField label="Name" value={signer.name} />
      <NamedField label="Title" value={signer.title ?? signer.roleName} />
      <NamedField label="Email" value={signer.email} small />
      <div className={`mt-1 truncate rounded px-1.5 py-0.5 text-[9px] font-mono ${c.bg} ${c.text} ring-1 ring-inset ${c.ring}`}>
        anchor: \\sig:{signer.side === "light" ? "light" : signer.side === "witness" ? "witness" : "counterparty"}\\
      </div>
    </div>
  );
}

function SignatureField({ label, type, signer }: { label: string; type: "sig" | "date"; signer: SignerDef }) {
  const c = SIDE_COLOR[signer.side];
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`mt-1 flex h-9 items-center justify-between gap-2 overflow-hidden rounded ${c.bg} px-2 ring-1 ring-inset ${c.ring}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`flex h-5 shrink-0 items-center rounded ${c.tab} px-1.5 text-[9px] font-bold uppercase tracking-wider ${c.tabText}`}>
            {type === "sig" ? "Sign" : "Date"}
          </span>
          <span className={`whitespace-nowrap text-[10px] ${c.text}`}>R{signer.routingOrder}</span>
        </div>
        <span className={`shrink-0 whitespace-nowrap text-[9px] italic ${c.text}`}>auto-placed</span>
      </div>
    </div>
  );
}

function NamedField({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`mt-0.5 border-b border-ink-300 pb-0.5 ${small ? "text-[10px]" : "text-[12px]"} text-ink-800`}>{value}</div>
    </div>
  );
}

// ── Page navigation ────────────────────────────────────────────────────────

function PageNav({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-ink-100 px-3 py-1.5 text-[12px] text-ink-700">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1 rounded px-2 py-1 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Previous
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          const isActive = p === page;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={
                "h-6 w-6 rounded text-[11px] font-medium " +
                (isActive ? "bg-ink-900 text-white" : "hover:bg-white")
              }
            >
              {p}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-1 rounded px-2 py-1 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Anchor tag bar ────────────────────────────────────────────────────────

function AnchorTagBar({ template }: { template: Template }) {
  return (
    <div className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2">
      <div className="flex items-center justify-between text-[11px] text-accent-800">
        <span className="font-semibold">Anchor tags ({template.anchorTags.length})</span>
        <span>All fields auto-placed by DocuSign · zero manual dragging</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {template.anchorTags.map((tag) => (
          <span key={tag} className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-accent-700 ring-1 ring-inset ring-accent-200">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── API call preview ────────────────────────────────────────────────────────

function ApiCallPreview({ contract, template, signers }: { contract: Contract; template: Template; signers: SignerDef[] }) {
  const payload = buildEnvelopePayload(contract, template, signers);
  return (
    <div className="space-y-2 rounded-lg border border-ink-200 bg-ink-950 p-4 font-mono text-[11px] text-ink-100">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-accent-300">
        <span className="rounded bg-sage-500/20 px-1.5 py-0.5 text-sage-500 ring-1 ring-inset ring-sage-500/30">POST</span>
        <span className="text-ink-300">https://demo.docusign.net/restapi/v2.1/accounts/a8c3-9d7f-2b4e/envelopes</span>
      </div>
      <div className="text-ink-400">Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.<span className="text-ink-300">…</span></div>
      <div className="text-ink-400">Content-Type: application/json</div>
      <div className="text-ink-400">DocuSign-Trace-Token: req_{contract.id.replace(/^c_/, "")}</div>
      <pre className="mt-2 max-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded bg-ink-900 p-3 text-[10.5px] leading-relaxed">
{JSON.stringify(payload, null, 2)}
      </pre>
      <div className="mt-2 text-[10px] text-ink-400">
        On 201 Created: DocuSign returns <span className="text-ink-200">envelopeId</span>, status <span className="text-ink-200">sent</span>, and starts firing Connect webhook events to our endpoint: <span className="text-ink-200">recipient-sent</span> → <span className="text-ink-200">recipient-delivered</span> → <span className="text-ink-200">recipient-completed</span> → <span className="text-ink-200">envelope-completed</span>.
      </div>
    </div>
  );
}

function buildEnvelopePayload(contract: Contract, template: Template, signers: SignerDef[]) {
  const tabsByRecipient: Record<string, { signHereTabs: { anchorString: string }[]; dateSignedTabs: { anchorString: string }[] }> = {};
  for (const s of signers) {
    const side = s.side === "light" ? "light" : s.side === "witness" ? "witness" : "counterparty";
    tabsByRecipient[String(s.routingOrder)] = {
      signHereTabs: [{ anchorString: `\\\\sig:${side}\\\\` }],
      dateSignedTabs: [{ anchorString: `\\\\date:${side}\\\\` }],
    };
  }

  return {
    emailSubject: `Please sign: ${contract.name}`,
    emailBlurb: `Please review and sign the attached ${template.formalName ?? template.name}. Reach out to ${signers[0]?.email} for questions.`,
    status: "sent",
    documents: [
      {
        documentId: "1",
        name: `${contract.name}.docx`,
        fileExtension: "docx",
        documentBase64: "<populated docx, base64-encoded>",
      },
    ],
    recipients: {
      signers: signers.map((s) => ({
        recipientId: String(s.routingOrder),
        routingOrder: String(s.routingOrder),
        roleName: s.roleName,
        name: s.name,
        email: s.email,
        clientUserId: s.side === "light" ? "light_internal" : undefined,
        ...(template.docusignFeatures.smsVerification && s.side === "counterparty"
          ? { identityVerification: { workflowId: "phone_otp" } }
          : {}),
        tabs: tabsByRecipient[String(s.routingOrder)],
      })),
    },
    eventNotification: {
      url: "https://light-documents.app/api/webhooks/docusign",
      includeDocuments: "true",
      includeCertificateOfCompletion: "true",
      events: ["envelope-sent", "recipient-delivered", "recipient-completed", "envelope-completed", "envelope-declined", "envelope-voided"],
    },
    notification: {
      expirations: { expireEnabled: "true", expireAfter: String(template.docusignFeatures.expiryDays ?? 14) },
      reminders: {
        reminderEnabled: "true",
        reminderDelay: String(template.docusignFeatures.reminderDays?.[0] ?? 3),
        reminderFrequency: String(template.docusignFeatures.reminderDays?.[1] ?? 4),
      },
    },
  };
}
