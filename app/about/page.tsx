import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Workflow,
  Target,
  Shield,
  Database,
  Users,
  FileType2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ListChecks,
} from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Header
        title="About this build"
        subtitle="Submission memo for the AI Strategy & Operations Associate case study at Light"
      />
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">

        {/* ─────────────────────────  1. PROBLEM + REFRAME  ───────────────────────── */}
        <Section title="The problem, and the reframe" icon={<Target className="h-4 w-4" />}>
          <p>
            The stated pain (manual Word edits and hand-placed DocuSign fields) is real. The workflow below kills both directly.
          </p>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5 text-[13px] leading-relaxed">
            <div className="demo-note mb-1.5">The reframe</div>
            Every signed contract is structured data (revenue, headcount, equity, vendor obligations) that belongs in the
            systems of record. <strong>The PDF is the audit artifact, the data is the product.</strong> Other CLMs ship
            integrations into N ERPs. Light <em>is</em> the ERP, so the writeback is a native capability rather than an integration.
          </div>
        </Section>

        {/* ─────────────────────────  2. THE ANSWER (one paragraph)  ───────────────────────── */}
        <Section title="The answer in one paragraph" icon={<Shield className="h-4 w-4" />}>
          <p>
            <strong>Wrap DocuSign as infrastructure. Keep Word + Drive for authoring. Build the workflow layer in between</strong>{" "}
            (intake → clause check → routing → anchor-tag envelope → ledger writeback), so every contract moves from
            approved business terms to a signed agreement whose data flows back into Light&apos;s systems of record.
          </p>
          <ul className="ml-1 mt-1 space-y-1 text-[13px]">
            <li className="flex gap-2"><span className="text-ink-400">•</span><span>No new editor for Counsel.</span></li>
            <li className="flex gap-2"><span className="text-ink-400">•</span><span>No new signing primitive.</span></li>
            <li className="flex gap-2"><span className="text-ink-400">•</span><span>The work happens in the gap, which is exactly the gap Light&apos;s ERP wedge can fill.</span></li>
          </ul>
        </Section>

        {/* ─────────────────────────  3. BUILD VS BUY  ───────────────────────── */}
        <Section title="Build vs buy" icon={<Workflow className="h-4 w-4" />}>
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="py-2 pr-3 align-bottom">Layer</th>
                  <th className="py-2 pr-3 align-bottom">Decision</th>
                  <th className="py-2 align-bottom">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <BvBRow
                  layer="E-signature, identity, audit trail"
                  decision="Buy / keep DocuSign"
                  tone="sage"
                  why="eIDAS QES in EU, ESIGN in US, court-tested. Not our edge."
                />
                <BvBRow
                  layer="Template authoring"
                  decision="Keep Word + Drive"
                  tone="sage"
                  why="Legal counsel will not adopt a new editor. We read templates from Drive, we do not host editing."
                />
                <BvBRow
                  layer="Full CLM (Ironclad, Juro, SpotDraft)"
                  decision="Defer, not dismiss"
                  tone="amber"
                  why="Juro and SpotDraft now target Series A SaaS in Europe with SMB pricing and ~30-day implementations. A pilot would cover ~70% of this workflow. The 30% they do not cover is the strategic wedge: writeback into Light's ledger, routing rules owned by Head of F&O, integration with the source records Light's customers already trust. Revisit at 500+ contracts / month."
                />
                <BvBRow
                  layer="Workflow layer (intake, validation, approval, generation, send orchestration, ledger writeback)"
                  decision="Build"
                  tone="ink"
                  why="This is the gap, and the gap Light's ERP wedge is uniquely positioned to fill."
                />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ─────────────────────────  4. THE ONE KEY DECISION  ───────────────────────── */}
        <Section title="The one key decision walked through" icon={<Shield className="h-4 w-4" />}>
          <p>
            <strong>Wrap DocuSign as infrastructure. Make contracts first-class structured data, not files.</strong>
          </p>
          <ol className="ml-5 list-decimal space-y-2 text-[13px]">
            <li>
              <strong>Legal.</strong> Rebuilding the signing layer means inheriting eIDAS, ESIGN, UETA, authority-to-bind
              verification, witnessing rules, and a decade of case-law compliance. Wrong battle for a Series A finance company.
            </li>
            <li>
              <strong>Adoption.</strong> Legal counsel authors contracts in Word. Forcing them into a new editor kills the
              rollout. We read what they write, we do not replace where they write.
            </li>
            <li>
              <strong>Strategic fit.</strong> Contracts are streams of structured data that belong in the systems of record
              Light already operates. The PDF is the audit artifact. This is the only contract approach that matches
              Light&apos;s product thesis, and it lets &quot;Light Documents&quot; ship as a customer-facing module after
              internal use proves it.
            </li>
          </ol>
          <div className="rounded-lg border border-ink-100 bg-white p-3 text-[12.5px] text-ink-500">
            <div className="demo-note mb-1">Smallest technical embodiment</div>
            DocuSign anchor tags embedded in templates as white-on-white text, paired with typed variables. Collapses
            &quot;manually drag signature fields&quot; from ~5 minutes per doc to zero, deterministically, without writing
            any signing code ourselves.
          </div>
        </Section>

        {/* ─────────────────────────  5. HOW COUNSEL KEEPS WORD  ───────────────────────── */}
        <Section title="How the Legal team keeps Word" icon={<FileType2 className="h-4 w-4" />}>
          <ul className="space-y-2 text-[13px]">
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">1.</span>
              <span>
                Master templates stay as Word docs in Google Drive (or SharePoint), owned by Legal. Counsel types{" "}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">{`{{counterparty.legal_name}}`}</code>{" "}
                and{" "}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">{`\\sig:counterparty\\`}</code>{" "}
                directly into the document as text.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">2.</span>
              <span>
                On save, Drive webhooks our platform. We parse the docx (zip of XML), extract variables and anchor tags,
                version-pin at contract create time.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">3.</span>
              <span>
                Per-contract substitution uses{" "}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">docxtemplater</code> (Node) or
                python-docx. Output is still a valid docx, opens in Word. Anchor tags are formatted as white-on-white text
                so invisible to signers but findable by DocuSign API{" "}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">searchString</code> tabs.
              </span>
            </li>
          </ul>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-[12.5px] text-ink-600">
            <strong className="text-ink-900">Why this matters.</strong> Forcing Counsel into a new editor is the single
            largest reason CLM rollouts fail. Counsel may still log in to approve a clause deviation when one is flagged.
            What stays out is authoring, not review. Everyone else (Sales, People Ops, Finance) uses Light Documents to{" "}
            <em>execute</em> against those templates.
          </div>
        </Section>

        {/* ─────────────────────────  6. THE FOUR EXITS (workflow visual)  ───────────────────────── */}
        <Section title="Cross-functional design: the four exits" icon={<Users className="h-4 w-4" />}>
          <p className="text-[13px]">
            The workflow layer sits between source systems (Salesforce / HubSpot / Attio / Personio / Ashby / Workday / Manual entry)
            and execution systems. Once a contract is approved, it leaves Light Documents through one of four surfaces.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ExitTile label="DocuSign" purpose="Signing" detail="Anchor-tag envelope, sequential signing, identity verification per template." />
            <ExitTile label="Slack" purpose="Internal approvals" detail="DM for the person who must act; channel post for team awareness." />
            <ExitTile label="Email magic link" purpose="Board + external counsel" detail="One-time link with audit-grade access. Non-Slack users handled cleanly." />
            <ExitTile label="Writeback" purpose="Light ledger / HRIS / cap table" detail="Structured payload per document type. MRR + ARR for MSAs; headcount for offers; cap-table delta for warrants." />
          </div>
          <div className="rounded-lg border border-ink-100 bg-white p-3 text-[12.5px] text-ink-500">
            <div className="demo-note mb-1">Owner</div>
            The Head of Finance &amp; Operations role (the role this case is for) owns the routing rules engine. Sees
            everything. Can override anything.
          </div>
        </Section>

        {/* ─────────────────────────  7. MVP SCOPE  ───────────────────────── */}
        <Section title="MVP scope" icon={<Database className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <ScopeColumn
              title="In scope"
              tone="sage"
              items={[
                "8 document templates with clause rules + DocuSign config + conditional sections",
                "Structured intake form (adapts to template type)",
                "Clause check engine (deterministic stand-in; production swaps in Claude with the same output shape)",
                "Rule-based approval routing with channels (Slack / email)",
                "DocuSign envelope preview with anchor-tag placement",
                "Signed record with audit trail + writeback to systems of record",
                "Dashboard with KPIs and filter chips",
                "3 Light entities (assumed): Denmark, UK, US Delaware",
              ]}
            />
            <ScopeColumn
              title="Out of scope (Phase 2+)"
              tone="rose"
              items={[
                "Real DocuSign eSignature REST API integration",
                "Real LLM for clause comparison (Claude API)",
                "Real Slack bot for interactive approvals",
                "OAuth integrations for Salesforce, HubSpot, etc.",
                "Counterparty redline portal",
                "Renewal and obligation tracking with calendar alerts",
                "Inbound vendor contracts",
                "Customer-facing module (after internal use)",
              ]}
            />
          </div>
        </Section>

        {/* ─────────────────────────  8. WHAT WORKS VS STUBBED (honest)  ───────────────────────── */}
        <Section title="What is real vs what is stubbed" icon={<ListChecks className="h-4 w-4" />}>
          <p className="text-[13px]">
            Every stubbed surface is labelled with a &quot;Demo:&quot; callout where it appears in the product.
          </p>
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="py-2 pr-3 align-bottom">Layer</th>
                  <th className="py-2 pr-3 align-bottom">Real today</th>
                  <th className="py-2 align-bottom">Stubbed for demo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <StubRow real="Next.js routing + state machine + immutable updates" stubbed="None" what="Workflow engine" />
                <StubRow real="Deterministic typed rules engine over ClauseRule[]" stubbed="Claude API (one-file swap when ready)" what="Clause checker" />
                <StubRow real="13 typed rules + computeRouting() with channel collision + committee logic" stubbed="None" what="Routing engine" />
                <StubRow real="Real envelope JSON shown in preview modal" stubbed="DocuSign REST API call" what="DocuSign send" />
                <StubRow real="Audit-trail events for every Slack action with realistic message body" stubbed="chat.postMessage with interactive buttons" what="Slack notifications" />
                <StubRow real="Structured payload generated per document type" stubbed="HTTP POST to Light ledger / HRIS / cap-table receivers" what="Writeback" />
                <StubRow real="localStorage with versioned schema, immutable updates, Reset-demo button" stubbed="Postgres + S3 + Redis" what="Persistence" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ─────────────────────────  9. WHAT I WOULD BUILD NEXT  ───────────────────────── */}
        <Section title="What I would build next (90 days)" icon={<Workflow className="h-4 w-4" />}>
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="py-2 pr-3 align-bottom">Order</th>
                  <th className="py-2 pr-3 align-bottom">Integration</th>
                  <th className="py-2 align-bottom">Why first</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <NextRow n="1" what="Slack (interactive approvals via DM)" why="Everyone is in Slack. Zero new tool to learn. The adoption gate." />
                <NextRow n="2" what="Light writeback (ledger / HRIS / cap table)" why="The strategic moat. Built in parallel with Slack so the first signed contract lands in a system of record, not just Drive." />
                <NextRow n="3" what="Salesforce + HubSpot deal read" why="30 to 50 contracts / month originate from Sales." />
                <NextRow n="4" what="DocuSign API (real envelopes + Connect webhooks)" why="Replaces simulated send. Well-documented API. Low risk." />
                <NextRow n="5" what="HRIS read (Personio, Ashby, Workday)" why="10 to 20 contracts / month from People Ops." />
                <NextRow n="6" what="Drive / SharePoint template sync" why="Replaces ad-hoc folder. Required for version control + compliance." />
                <NextRow n="7" what="Email magic links" why="Handles board, external counsel, non-Slack users." />
                <NextRow n="8" what="Calendar alerts for renewals" why="Closes the loop on obligations." />
              </tbody>
            </table>
          </div>
          <p className="text-[12.5px] text-ink-500">
            Slack-first is for adoption. Writeback at #2 is the strategic extension. In an actual rollout I would build the
            two in parallel, so the first signed contract has somewhere structured to land on day one, not just Drive.
          </p>
        </Section>

        {/* ─────────────────────────  10. STATED ASSUMPTIONS  ───────────────────────── */}
        <Section title="Stated assumptions" icon={<AlertTriangle className="h-4 w-4" />}>
          <ol className="ml-5 list-decimal space-y-1.5 text-[13px]">
            <li>Light has master Word templates in Drive (or SharePoint) owned by Legal and People, not yet connected to source systems.</li>
            <li>DocuSign is the existing signing tool, with partial template / AutoPlace usage but inconsistent practice.</li>
            <li>Source data lives in Salesforce or HubSpot (deals), an HRIS (employees), and Light&apos;s own ledger (vendors, cap table).</li>
            <li>Approvers are real humans on Slack. Routing rules are owned by Head of Finance &amp; Ops.</li>
            <li>Volume is the stated 50 to 100 contracts / month. CLM-scale tools are overkill for this throughput today.</li>
            <li>
              Light operates three legal entities (assumed): Light ApS (Denmark, primary), Light Ltd (UK, post-Brexit),
              Light Inc. (US Delaware, for US expansion). Realistic Series A structure for a Danish-headquartered SaaS
              company. Would verify with Head of F&amp;O in week one.
            </li>
          </ol>
        </Section>

        {/* ─────────────────────────  11. A NOTE ON THE NAMES  ───────────────────────── */}
        <Section title="A note on the names in this demo" icon={<Users className="h-4 w-4" />}>
          <p className="text-[13px]">
            All personas (Martina Holst as Head of F&amp;O, Sara Friis as in-house counsel, Tom Bauer as the AE, plus
            board members and outside counsel) are illustrative stand-ins. Replace the directory + seed data and the same
            flow runs against Light&apos;s real org chart.
          </p>
        </Section>

        {/* ─────────────────────────  12. TECH STACK  ───────────────────────── */}
        <Section title="Tech stack" icon={<Database className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-2">
            <Badge tone="slate">Next.js 15</Badge>
            <Badge tone="slate">TypeScript strict</Badge>
            <Badge tone="slate">Tailwind 3.4</Badge>
            <Badge tone="slate">React 19</Badge>
            <Badge tone="slate">localStorage state</Badge>
            <Badge tone="slate">No backend in prototype</Badge>
          </div>
          <p className="text-[12.5px] text-ink-500">
            Prototype: state in localStorage with a real state machine and immutable updates. Production swap: Postgres,
            Redis queue, S3 / GCS for signed PDFs, Vercel or AWS hosting, SSO via Google Workspace or Okta.
          </p>
        </Section>
      </div>
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card title={<div className="flex items-center gap-2">{icon}{title}</div>}>
      <div className="space-y-3 text-[14px] leading-relaxed text-ink-700">{children}</div>
    </Card>
  );
}

function BvBRow({
  layer,
  decision,
  why,
  tone,
}: {
  layer: string;
  decision: string;
  why: string;
  tone: "sage" | "amber" | "ink" | "rose";
}) {
  return (
    <tr>
      <td className="py-2.5 pr-3 align-top font-medium text-ink-900">{layer}</td>
      <td className="py-2.5 pr-3 align-top">
        <Badge tone={tone}>{decision}</Badge>
      </td>
      <td className="py-2.5 align-top text-ink-600">{why}</td>
    </tr>
  );
}

function NextRow({ n, what, why }: { n: string; what: string; why: string }) {
  return (
    <tr>
      <td className="py-2.5 pr-3 align-top font-mono text-[12px] text-ink-500">{n}</td>
      <td className="py-2.5 pr-3 align-top font-medium text-ink-900">{what}</td>
      <td className="py-2.5 align-top text-ink-600">{why}</td>
    </tr>
  );
}

function StubRow({ what, real, stubbed }: { what: string; real: string; stubbed: string }) {
  return (
    <tr>
      <td className="py-2.5 pr-3 align-top font-medium text-ink-900">{what}</td>
      <td className="py-2.5 pr-3 align-top">
        <div className="flex items-start gap-1.5 text-ink-700">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-500" />
          <span>{real}</span>
        </div>
      </td>
      <td className="py-2.5 align-top">
        <div className="flex items-start gap-1.5 text-ink-500">
          {stubbed === "None" ? (
            <span className="text-ink-300">{stubbed}</span>
          ) : (
            <>
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
              <span>{stubbed}</span>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function ExitTile({ label, purpose, detail }: { label: string; purpose: string; detail: string }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-3">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
        {label}
        <ArrowRight className="h-3 w-3 text-ink-400" />
        <span className="font-normal text-ink-500">{purpose}</span>
      </div>
      <div className="mt-1 text-[12.5px] text-ink-600">{detail}</div>
    </div>
  );
}

function ScopeColumn({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "sage" | "rose";
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-ink-100 p-3.5">
      <Badge tone={tone} className="mb-2">
        {title}
      </Badge>
      <ul className="space-y-1.5 text-[13px]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-0.5 text-ink-300">{tone === "sage" ? "✓" : "✕"}</span>
            <span className="text-ink-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
