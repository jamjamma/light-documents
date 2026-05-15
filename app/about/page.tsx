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
  Github,
  FileText,
  BookOpen,
} from "lucide-react";

const REPO_URL = "https://github.com/jamjamma/light-documents";
const README_URL = `${REPO_URL}/blob/main/README.md`;
const PART_2_URL = `${REPO_URL}/blob/main/case-study/PART-2-COHORT-ANALYSIS.md`;
const PART_3_URL = `${REPO_URL}/blob/main/case-study/PART-3-DAY-ONE.md`;
const DECISIONS_URL = `${REPO_URL}/blob/main/docs/decisions.md`;

export default function AboutPage() {
  return (
    <>
      <Header
        title="About this build"
        subtitle="Submission memo for the AI Strategy & Operations Associate case study at Light"
      />
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">

        {/* ─────────────────────────  TOP: TOUR CTA  ───────────────────────── */}
        <div className="rounded-lg border border-accent-300 bg-accent-50/60 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[13px] text-ink-700">
              <strong className="text-ink-900">Short on time?</strong> The Take the Tour button in the sidebar walks
              the whole build in ~9 minutes with popovers explaining each surface. It was built to save you the time
              of reading this memo. Six chapters; start any one on its own.
            </div>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 ring-1 ring-inset ring-ink-200">
              ~9 min guided walk
            </span>
          </div>
        </div>

        {/* ─────────────────────────  TOP: PROMINENT LINKS  ───────────────────────── */}
        <Card>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-900">
              <BookOpen className="h-3.5 w-3.5" />
              The full case study has three parts
            </div>
            <p className="text-[12.5px] text-ink-600">
              You are on <strong className="text-ink-900">Part 1</strong> right now (this page is the build memo).
              Parts 2 and 3 are linked below, alongside the long-form README and the source.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <PrimaryLinkTile href={PART_2_URL} title="Part 2 →" detail="SaaS cohort analysis." />
              <PrimaryLinkTile href={PART_3_URL} title="Part 3 →" detail="Day-one mindset + the 1-1 plan." />
              <PrimaryLinkTile href={README_URL} title="README.md →" detail="Long-form of this page (Part 1)." icon={<FileText className="h-3.5 w-3.5" />} />
              <PrimaryLinkTile href={REPO_URL} title="Repo →" detail="Source code + decision log." icon={<Github className="h-3.5 w-3.5" />} />
            </div>
          </div>
        </Card>

        {/* ─────────────────────────  1. PROBLEM + REFRAME  ───────────────────────── */}
        <Section title="The problem, and the reframe" icon={<Target className="h-4 w-4" />}>

          {/* The problem */}
          <div>
            <div className="demo-note mb-2">The problem</div>
            <ul className="space-y-1.5 text-[13px]">
              <li className="flex gap-2">
                <span className="text-ink-400">•</span>
                <span>
                  <strong>Manual Word edits per contract.</strong> Counterparty, value, payment terms, governing law,
                  signers, more depending on template. Every field is a place for a typo or a stale value.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-ink-400">•</span>
                <span>
                  <strong>Hand-placed DocuSign fields.</strong> Signature, date, initial blocks dragged into position
                  per envelope, per signer, every time.
                </span>
              </li>
            </ul>
            <p className="mt-2 text-[12.5px] text-ink-600">
              At Light&apos;s stated 50 to 100 contracts / month, the friction is a steady operational tax. Worse, the
              structured data inside each contract is lost on the way out, so RevOps re-keys it later. The workflow
              below kills both at the root.
            </p>
          </div>

          {/* The reframe */}
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5 text-[13px] leading-relaxed">
            <div className="demo-note mb-2">The reframe</div>
            <p className="mb-2.5 text-ink-700">
              Most contracts already carry the data Light needs. The opportunity is to capture it on the way out,
              not re-key it later.
            </p>
            <ul className="space-y-2.5 text-ink-700">
              <li>
                <div className="flex gap-2">
                  <span className="text-ink-400">•</span>
                  <span>
                    <strong>Commercial contracts → structured data.</strong>
                  </span>
                </div>
                <ul className="ml-5 mt-1 space-y-0.5 text-ink-600">
                  <li>– MSAs and Order Forms → revenue and billing (MRR, ARR, renewal date)</li>
                  <li>– Employment → headcount and compensation</li>
                  <li>– Warrants → cap table</li>
                  <li>– Vendor → AP and obligation tracking</li>
                </ul>
              </li>
              <li className="flex gap-2">
                <span className="text-ink-400">•</span>
                <span>
                  <strong>NDAs are the exception.</strong> No commercial value to post; they file for retention only.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-ink-400">•</span>
                <span>
                  <strong>The writeback lands where Light has a receiver.</strong> The prototype emits the payload on
                  envelope completion. Production wires it into whichever receivers Light operates.
                </span>
              </li>
            </ul>
            <p className="mt-3 text-ink-600">
              <strong className="text-ink-900">The PDF is the audit artifact. The data is the product.</strong>{" "}
              That is the strategic opening, conditional on Light&apos;s product direction.
            </p>
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
            <li className="flex gap-2"><span className="text-ink-400">•</span><span>No new editor for the legal team who owns the master templates. They keep working in Word.</span></li>
            <li className="flex gap-2"><span className="text-ink-400">•</span><span>No new signing primitive. DocuSign stays the system of record for signatures.</span></li>
            <li className="flex gap-2"><span className="text-ink-400">•</span><span>The work happens in the gap; that is the strategic opening for Light, conditional on its product direction.</span></li>
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
                  decision="Keep DocuSign"
                  why="eIDAS QES in EU, ESIGN in US, court-tested. Not our edge."
                />
                <BvBRow
                  layer="Template authoring"
                  decision="Keep Word + Drive"
                  why="Legal will not adopt a new editor. We read templates from Drive; we do not host editing."
                />
                <BvBRow
                  layer="Full CLM (Ironclad, Juro, SpotDraft)"
                  decision="Defer, not dismiss"
                  why="Covers ~70% of this workflow. The 30% they do not cover is where Light could differentiate. Revisit at 500+ contracts / month."
                />
                <BvBRow
                  layer="Workflow layer (intake → routing → envelope → writeback)"
                  decision="Build"
                  why="The gap simpler tools miss and bigger CLMs over-build. Sized for Light's volume today; the writeback shape is reusable if direction supports it."
                />
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-ink-500">
            Full paper trail (alternatives considered, what was deliberately cut) in{" "}
            <a href={DECISIONS_URL} target="_blank" rel="noreferrer" className="text-ink-900 underline">
              docs/decisions.md
            </a>
            .
          </p>
        </Section>

        {/* ─────────────────────────  5. HOW THE LEGAL TEAM KEEPS WORD  ───────────────────────── */}
        <Section title="How the Legal team keeps Word" icon={<FileType2 className="h-4 w-4" />}>
          <ul className="space-y-2 text-[13px]">
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">1.</span>
              <span>
                Master templates stay as Word docs in Drive, owned by Legal. Counsel types{" "}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">{`{{counterparty.legal_name}}`}</code>{" "}
                and{" "}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">{`\\sig:counterparty\\`}</code>{" "}
                directly into the doc as text.
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
                python-docx. Output is still a valid docx. Anchor tags are white-on-white so invisible to signers, findable
                by DocuSign API <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">searchString</code> tabs.
              </span>
            </li>
          </ul>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-[12.5px] text-ink-600">
            <strong className="text-ink-900">What we ask of Counsel.</strong> Drafting stays in Word, exactly as today.
            Counsel logs into Light Documents only when a clause deviation is flagged for their review. No new editor,
            no new place to author.
          </div>
        </Section>

        {/* ─────────────────────────  6. THE FOUR EXITS  ───────────────────────── */}
        <Section title="Cross-functional design: the four exits" icon={<Users className="h-4 w-4" />}>
          <p className="text-[13px]">
            The workflow layer sits between source systems (Salesforce / HubSpot / Attio / Personio / Ashby / Workday / Manual)
            and execution. Once a contract is approved, it leaves through one of four surfaces.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ExitTile label="DocuSign" purpose="Signing" detail="Anchor-tag envelope, sequential signing, per-template identity verification." />
            <ExitTile label="Slack" purpose="Internal approvals" detail="DM for the person who must act; channel post for team awareness." />
            <ExitTile label="Email magic link" purpose="Board + external counsel" detail="One-time link with audit-grade access. Non-Slack users handled cleanly." />
            <ExitTile label="Writeback" purpose="Light ledger / HRIS / cap table" detail="Structured payload per document type. MRR + ARR for MSAs; headcount for offers; cap-table delta for warrants." />
          </div>
          <div className="rounded-lg border border-ink-100 bg-white p-3 text-[12.5px] text-ink-500">
            <div className="demo-note mb-1">Owner</div>
            Head of Finance &amp; Operations (the role this case is for) owns the routing rules engine. Sees everything. Can override anything.
          </div>
        </Section>

        {/* ─────────────────────────  7. MVP SCOPE  ───────────────────────── */}
        <Section title="MVP scope" icon={<Database className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <ScopeColumn
              title="In scope"
              tone="sage"
              items={[
                "8 document templates with clause rules + DocuSign config",
                "Structured intake form (adapts to template type)",
                "Clause check engine (deterministic; production swaps in Claude)",
                "Rule-based approval routing with Slack / email channels",
                "DocuSign envelope preview with anchor-tag placement",
                "Signed record with audit trail + writeback",
                "Dashboard with KPIs and filter chips",
                "3 Light entities (assumed): Denmark, UK, US Delaware",
              ]}
            />
            <ScopeColumn
              title="Out of scope (Phase 2+)"
              tone="rose"
              items={[
                "Real DocuSign REST API integration",
                "Real Claude API for clause comparison",
                "Real Slack bot for interactive approvals",
                "OAuth into Salesforce, HubSpot, etc.",
                "Counterparty redline portal",
                "Renewal + obligation tracking with calendar alerts",
                "Inbound vendor contracts",
                "Customer-facing module",
              ]}
            />
          </div>
        </Section>

        {/* ─────────────────────────  8. REAL VS STUBBED  ───────────────────────── */}
        <Section title="What is real vs what is stubbed" icon={<ListChecks className="h-4 w-4" />}>
          <p className="text-[13px] text-ink-500">
            Every stubbed surface carries a &quot;Demo:&quot; callout where it appears in the product.
          </p>
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="py-2 pr-3 align-bottom">Layer</th>
                  <th className="py-2 pr-3 align-bottom">Real today</th>
                  <th className="py-2 align-bottom">Stubbed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <StubRow what="Workflow engine" real="Next.js routing + state machine + immutable updates" stubbed="None" />
                <StubRow what="Clause checker" real="Deterministic typed rules over ClauseRule[]" stubbed="Claude API (one-file swap)" />
                <StubRow what="Routing engine" real="14 typed rules + computeRouting() with channel collision logic" stubbed="None" />
                <StubRow what="DocuSign send" real="Real envelope JSON shown in preview modal" stubbed="DocuSign REST API call" />
                <StubRow what="Slack notifications" real="Audit-trail events with realistic message body" stubbed="chat.postMessage with interactive buttons" />
                <StubRow what="Writeback" real="Structured payload generated per document type" stubbed="HTTP POST to ledger / HRIS / cap-table receivers" />
                <StubRow what="Persistence" real="localStorage with versioned schema, Reset-demo button" stubbed="Postgres + S3 + Redis" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ─────────────────────────  9. NEXT 90 DAYS  ───────────────────────── */}
        <Section title="What I would build next (90 days)" icon={<Workflow className="h-4 w-4" />}>
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="py-2 pr-3 align-bottom">#</th>
                  <th className="py-2 pr-3 align-bottom">Integration</th>
                  <th className="py-2 align-bottom">Why first</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <NextRow n="1" what="Slack (interactive approvals via DM)" why="Everyone is in Slack. The adoption gate." />
                <NextRow n="2" what="Light writeback (ledger / HRIS / cap table)" why="The strategic extension; conditional on which receivers Light has exposed. Built parallel with Slack so the first signed contract lands somewhere structured if the receiver is ready." />
                <NextRow n="3" what="Salesforce + HubSpot deal read" why="30 to 50 contracts / month originate from Sales." />
                <NextRow n="4" what="DocuSign API (real envelopes + Connect webhooks)" why="Replaces simulated send. Well-documented. Low risk." />
                <NextRow n="5" what="HRIS read (Personio, Ashby, Workday)" why="10 to 20 contracts / month from People Ops." />
                <NextRow n="6" what="Drive / SharePoint template sync" why="Replaces ad-hoc folder. Version control + compliance." />
                <NextRow n="7" what="Email magic links" why="Board, external counsel, non-Slack users." />
                <NextRow n="8" what="Calendar alerts for renewals" why="Closes the loop on obligations." />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ─────────────────────────  10. WHERE V2 GOES  ───────────────────────── */}
        <Section title="Where v2 goes" icon={<ArrowRight className="h-4 w-4" />}>
          <ol className="ml-5 list-decimal space-y-2 text-[13px]">
            <li>
              <strong>Light Documents as a customer module.</strong> Same workflow turned on for Light&apos;s customers.
              Series A finance teams sign the same MSAs, offers, warrants, vendor agreements; they need the same writeback.
            </li>
            <li>
              <strong>Inbound contracts (counterparty papers).</strong> v1 handles Light-paper-out. v2 handles
              counterparty-paper-in: parse, compare against our master library, flag deviations, route to Legal. Where
              Claude earns its keep.
            </li>
            <li>
              <strong>Renewal and obligation tracking.</strong> Every signed contract carries dates and obligations.
              Calendar alerts at T-90 and T-30 close the loop on revenue retention and vendor cost.
            </li>
          </ol>
        </Section>

        {/* ─────────────────────────  11. ASSUMPTIONS  ───────────────────────── */}
        <Section title="Stated assumptions" icon={<AlertTriangle className="h-4 w-4" />}>
          <ol className="ml-5 list-decimal space-y-1.5 text-[13px]">
            <li>Light has master Word templates in Drive (or SharePoint) owned by Legal and People, not yet connected to source systems.</li>
            <li>DocuSign is the existing signing tool, with partial template / AutoPlace usage but inconsistent practice.</li>
            <li>Source data lives in Salesforce or HubSpot (deals), an HRIS (employees), and Light&apos;s own ledger (vendors, cap table).</li>
            <li>Approvers are real humans on Slack. Routing rules are owned by Head of Finance &amp; Ops.</li>
            <li>Volume is the stated 50 to 100 contracts / month. CLM-scale tools are overkill at this throughput.</li>
            <li>Light operates three legal entities (assumed): Light ApS (Denmark, primary), Light Ltd (UK), Light Inc. (US Delaware). Would verify with Head of F&amp;O in week one.</li>
          </ol>
        </Section>

        {/* ─────────────────────────  12. NAMES + STACK  ───────────────────────── */}
        <Section title="Names and stack" icon={<Database className="h-4 w-4" />}>
          <p className="text-[13px]">
            All personas (Martina Holst as Head of F&amp;O, Sara Friis as in-house counsel, Tom Bauer as the AE, plus
            board and outside counsel) are illustrative stand-ins. Replace the directory + seed data; the same flow runs
            against Light&apos;s real org chart.
          </p>
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

function BvBRow({ layer, decision, why }: { layer: string; decision: string; why: string }) {
  return (
    <tr>
      <td className="py-2.5 pr-3 align-top font-medium text-ink-900">{layer}</td>
      <td className="py-2.5 pr-3 align-top font-semibold text-ink-900">{decision}</td>
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

function ScopeColumn({ title, tone, items }: { title: string; tone: "sage" | "rose"; items: string[] }) {
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

function PrimaryLinkTile({
  href,
  title,
  detail,
  icon,
}: {
  href: string;
  title: string;
  detail: string;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-start gap-2 rounded-lg border border-ink-200 bg-white p-2.5 transition-all hover:border-ink-900 hover:shadow-sm"
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-ink-50 text-ink-700 group-hover:bg-ink-900 group-hover:text-white">
        {icon ?? <FileText className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-900">
          {title}
          <ArrowRight className="h-3 w-3 text-ink-400 group-hover:text-ink-900" />
        </div>
        <div className="truncate text-[11px] text-ink-500">{detail}</div>
      </div>
    </a>
  );
}
