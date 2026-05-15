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
  Play,
} from "lucide-react";

const REPO_URL = "https://github.com/jamjamma/light-documents";
const README_URL = `${REPO_URL}/blob/main/README.md`;
const PART_2_URL = `${REPO_URL}/blob/main/case-study/PART-2-COHORT-ANALYSIS.md`;
const PART_3_URL = `${REPO_URL}/blob/main/case-study/PART-3-DAY-ONE.md`;
const PROJECT_DOC_URL = `${REPO_URL}/blob/main/docs/PROJECT.md`;
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
        <div className="rounded-lg border border-accent-300 bg-accent-50/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              {/* Title — names the feature explicitly */}
              <div className="flex items-center gap-2 text-[14.5px] font-bold text-ink-900">
                <Play className="h-4 w-4 text-accent-700" />
                Take the guided tour
              </div>
              {/* One-line why — italicized so the warm framing sits softly,
                  not as another bold imperative. */}
              <p className="text-[12.5px] italic text-ink-700">
                Built to save your precious time. Open it from the sidebar.
              </p>
              {/* Scannable bullets */}
              <ul className="space-y-1 text-[12.5px] text-ink-700">
                <li className="flex gap-2">
                  <span className="text-accent-700">•</span>
                  <span>Walks the whole build with popovers on every surface.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-700">•</span>
                  <span>Six chapters; start any one on its own.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-700">•</span>
                  <span>Skip what you have already seen.</span>
                </li>
              </ul>
            </div>
            {/* Time chip */}
            <span className="shrink-0 self-start rounded-full bg-ink-900 px-3 py-1.5 text-[12px] font-semibold text-white">
              ~9 min
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
              Parts 2 and 3 are linked below.
            </p>

            {/* The three case-study parts */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <PrimaryLinkTile
                href="/about"
                title="Part 1: This memo"
                detail="Build vs buy, scope, and why."
              />
              <PrimaryLinkTile
                href={PART_2_URL}
                title="Part 2: Read the business"
                detail="Cohort analysis: NRR + ARR projection."
              />
              <PrimaryLinkTile
                href={PART_3_URL}
                title="Part 3: Day-one mindset"
                detail="The week before the 1-1 with Martina."
              />
            </div>

            {/* Build-side reading: visually separated from the case-study parts */}
            <div className="mt-3 border-t border-ink-100 pt-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Source and reference docs
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <PrimaryLinkTile
                  href={README_URL}
                  title="README.md"
                  detail="Long-form of this memo on GitHub."
                  icon={<FileText className="h-3.5 w-3.5" />}
                />
                <PrimaryLinkTile
                  href={PROJECT_DOC_URL}
                  title="PROJECT.md"
                  detail="Engineering deep-dive into how the build works."
                  icon={<FileText className="h-3.5 w-3.5" />}
                />
                <PrimaryLinkTile
                  href={REPO_URL}
                  title="Repo"
                  detail="Source + 14 architectural decisions."
                  icon={<Github className="h-3.5 w-3.5" />}
                />
              </div>
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

        {/* ─────────────────────────  2. THE ANSWER  ───────────────────────── */}
        <Section title="The answer in one paragraph" icon={<Shield className="h-4 w-4" />}>

          {/* Three-part formula */}
          <p className="text-[15px] font-semibold text-ink-900">
            Wrap DocuSign. Keep Word + Drive. Build the workflow layer in between.
          </p>

          {/* Visual workflow chain */}
          <div className="rounded-md border border-ink-100 bg-ink-50/50 px-3 py-2 font-mono text-[12.5px] text-ink-700">
            intake → clause check → routing → anchor-tag envelope → ledger writeback
          </div>

          {/* Why each part */}
          <p className="text-[13px] text-ink-600">
            Every contract moves from approved business terms to a signed agreement whose data flows back into Light&apos;s
            systems of record. The three reasons it lands cleanly:
          </p>
          <ul className="ml-1 space-y-1.5 text-[13px]">
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">•</span>
              <span>
                <strong>No new editor.</strong> The legal team keeps working in Word, where the master templates already live.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">•</span>
              <span>
                <strong>No new signing primitive.</strong> DocuSign stays the system of record for signatures.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">•</span>
              <span>
                <strong>The work happens in the gap.</strong> That gap is the strategic opening for Light, conditional on its product direction.
              </span>
            </li>
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
                  whyLead="Not our edge."
                  whyDetail="eIDAS QES in EU, ESIGN in US, court-tested."
                />
                <BvBRow
                  layer="Template authoring"
                  decision="Keep Word + Drive"
                  whyLead="No new editor."
                  whyDetail="Legal will not adopt one. We read templates from Drive; we do not host editing."
                />
                <BvBRow
                  layer="Full CLM (Ironclad, Juro, SpotDraft)"
                  decision="Defer, not dismiss"
                  whyLead="Covers ~70%. Light owns the 30%."
                  whyDetail="Juro and SpotDraft cover the bulk. The gap is where Light could differentiate. Revisit at 500+ contracts / month."
                />
                <BvBRow
                  layer="Workflow layer (intake → routing → envelope → writeback)"
                  decision="Build"
                  whyLead="The gap."
                  whyDetail="Simpler tools miss it, bigger CLMs over-build it. Sized for Light's volume today; the writeback shape is reusable if direction supports it."
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
          <NextGroup
            label="Adoption gate"
            tone="accent"
            items={[
              { n: "1", what: "Slack (interactive approvals via DM)", why: "Everyone is in Slack. Zero new tool to learn." },
            ]}
          />
          <NextGroup
            label="Strategic extension (built parallel with Slack)"
            tone="sage"
            items={[
              { n: "2", what: "Light writeback (ledger / HRIS / cap table)", why: "So the first signed contract lands somewhere structured. Conditional on which receivers Light has exposed." },
            ]}
          />
          <NextGroup
            label="Replace demo stubs with real integrations"
            tone="slate"
            items={[
              { n: "3", what: "Salesforce + HubSpot deal read", why: "Most contracts originate from Sales." },
              { n: "4", what: "DocuSign API (real envelopes + Connect webhooks)", why: "Replaces simulated send. Well-documented. Low risk." },
              { n: "5", what: "HRIS read (Personio, Ashby, Workday)", why: "Offer letters originate from People Ops." },
              { n: "6", what: "Drive / SharePoint template sync", why: "Replaces ad-hoc folder. Version control + compliance." },
            ]}
          />
          <NextGroup
            label="Close the loop"
            tone="slate"
            items={[
              { n: "7", what: "Email magic links", why: "Board, external counsel, non-Slack users." },
              { n: "8", what: "Calendar alerts for renewals", why: "Closes the loop on obligations." },
            ]}
          />
        </Section>

        {/* ─────────────────────────  10. ASSUMPTIONS  ───────────────────────── */}
        <Section title="Stated assumptions" icon={<AlertTriangle className="h-4 w-4" />}>
          <div className="rounded-lg border-l-4 border-accent-400 border-y border-r border-y-accent-200 border-r-accent-200 bg-accent-50/60 p-4">
            <p className="mb-3 text-[13px] text-ink-700">
              <strong className="text-ink-900">Worth verifying in week one with Head of F&amp;O.</strong>{" "}
              The build holds if these are roughly right; specific endpoints may differ.
            </p>
            <div className="space-y-3.5 text-[13px]">

              {/* Tools today */}
              <div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent-700">
                  About the tools Light uses today
                </div>
                <ul className="ml-1 space-y-1.5 text-ink-700">
                  <li className="flex gap-2">
                    <span className="text-ink-400">•</span>
                    <span>
                      <strong className="text-ink-900">Master Word templates in Drive</strong> (or SharePoint), owned by Legal and People, not yet connected to source systems.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-ink-400">•</span>
                    <span>
                      <strong className="text-ink-900">DocuSign is the existing signing tool</strong>, with partial template / AutoPlace usage but inconsistent practice.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-ink-400">•</span>
                    <span>
                      <strong className="text-ink-900">Source data lives in Salesforce or HubSpot</strong> (deals), an HRIS (employees), and Light&apos;s own internal systems (vendors, cap table).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-ink-400">•</span>
                    <span>
                      <strong className="text-ink-900">Approvers are real humans on Slack.</strong> Routing rules are owned by Head of Finance &amp; Ops.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Scale */}
              <div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent-700">
                  About scale (from the brief)
                </div>
                <ul className="ml-1 space-y-1.5 text-ink-700">
                  <li className="flex gap-2">
                    <span className="text-ink-400">•</span>
                    <span>
                      <strong className="text-ink-900">50 to 100 contracts / month.</strong> CLM-scale tools are overkill at this throughput.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Org structure */}
              <div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent-700">
                  About corporate structure (assumed)
                </div>
                <ul className="ml-1 space-y-1.5 text-ink-700">
                  <li className="flex gap-2">
                    <span className="text-ink-400">•</span>
                    <span>
                      <strong className="text-ink-900">Three legal entities:</strong>{" "}
                      <strong className="text-ink-900">Light ApS</strong> (Denmark, primary),{" "}
                      <strong className="text-ink-900">Light Ltd</strong> (UK, post-Brexit),{" "}
                      <strong className="text-ink-900">Light Inc.</strong> (US Delaware, for US expansion).
                      Realistic Series A multi-jurisdiction shape for a Danish-headquartered SaaS company.
                    </span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
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

function BvBRow({
  layer,
  decision,
  whyLead,
  whyDetail,
}: {
  layer: string;
  decision: string;
  whyLead: string;
  whyDetail: string;
}) {
  return (
    <tr>
      <td className="py-2.5 pr-3 align-top font-medium text-ink-900">{layer}</td>
      <td className="py-2.5 pr-3 align-top font-semibold text-ink-900">{decision}</td>
      <td className="py-2.5 align-top text-ink-600">
        <strong className="text-ink-900">{whyLead}</strong> {whyDetail}
      </td>
    </tr>
  );
}

function NextGroup({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "accent" | "sage" | "slate";
  items: { n: string; what: string; why: string }[];
}) {
  const toneClass =
    tone === "accent"
      ? "border-accent-300 bg-accent-50/30"
      : tone === "sage"
        ? "border-sage-500/30 bg-sage-50/40"
        : "border-ink-200 bg-white";
  const labelClass =
    tone === "accent"
      ? "text-accent-700"
      : tone === "sage"
        ? "text-sage-600"
        : "text-ink-600";
  return (
    <div className={`rounded-lg border ${toneClass} p-3`}>
      <div className={`mb-2 text-[10.5px] font-semibold uppercase tracking-wider ${labelClass}`}>
        {label}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.n} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px]">
            <span className="row-span-2 mt-0.5 font-mono text-[11.5px] text-ink-400">
              {item.n}.
            </span>
            <div className="font-medium text-ink-900">{item.what}</div>
            <div className="text-[12.5px] text-ink-600">{item.why}</div>
          </li>
        ))}
      </ul>
    </div>
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
        <div className="text-[11px] leading-snug text-ink-500">{detail}</div>
      </div>
    </a>
  );
}
