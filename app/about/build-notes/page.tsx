import Link from "next/link";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Workflow,
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
  ArrowLeft,
  Compass,
} from "lucide-react";

const REPO_URL = "https://github.com/jamjamma/light-documents";
const DECISIONS_URL = `${REPO_URL}/blob/main/docs/decisions.md`;
const PROJECT_DOC_URL = `${REPO_URL}/blob/main/docs/PROJECT.md`;
const PART_2_URL = `${REPO_URL}/blob/main/case-study/PART-2-COHORT-ANALYSIS.md`;
const PART_3_URL = `${REPO_URL}/blob/main/case-study/PART-3-DAY-ONE.md`;

export default function BuildNotesPage() {
  return (
    <>
      <Header
        title="Build notes"
        subtitle="Deeper material for the technical reviewer: build vs buy, scope, real vs stubbed, what ships next."
      />
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">

        {/* ─────────────────────────  0. NAV BACK + DEEP LINKS  ───────────────────────── */}
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-[13px] text-ink-600">
              <div className="flex items-center gap-1.5 font-medium text-ink-900">
                <Compass className="h-3.5 w-3.5" />
                You are reading the deep version
              </div>
              <p className="mt-1 text-ink-500">
                For the one-paragraph thesis and the demo guide, go to the skim page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-900 transition-colors hover:bg-ink-50"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to About
              </Link>
              <ExternalLinkPill href={PROJECT_DOC_URL} icon={<FileText className="h-3 w-3" />} label="Project map" />
              <ExternalLinkPill href={PART_2_URL} label="Case Part 2" />
              <ExternalLinkPill href={PART_3_URL} label="Case Part 3" />
              <ExternalLinkPill href={REPO_URL} icon={<Github className="h-3 w-3" />} label="Repo" />
            </div>
          </div>
        </Card>

        {/* ─────────────────────────  1. BUILD VS BUY  ───────────────────────── */}
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
                  why="eIDAS QES in EU, ESIGN in US, court-tested. Not our edge."
                />
                <BvBRow
                  layer="Template authoring"
                  decision="Keep Word + Drive"
                  why="Legal counsel will not adopt a new editor. We read templates from Drive, we do not host editing."
                />
                <BvBRow
                  layer="Full CLM (Ironclad, Juro, SpotDraft)"
                  decision="Defer, not dismiss"
                  why="Juro and SpotDraft now target Series A SaaS in Europe with SMB pricing and ~30-day implementations. A pilot would cover ~70% of this workflow. The 30% they do not cover is where Light could differentiate: writeback into Light's ledger, routing rules owned by Head of F&O, integration with the source records Light's customers already trust. Revisit at 500+ contracts / month."
                />
                <BvBRow
                  layer="Workflow layer (intake, validation, approval, generation, send orchestration, ledger writeback)"
                  decision="Build"
                  why="This is the gap. It is the part Light could uniquely own if it chose to operationalise it."
                />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ─────────────────────────  2. THE ONE KEY DECISION  ───────────────────────── */}
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

        {/* ─────────────────────────  3. HOW THE LEGAL TEAM KEEPS WORD  ───────────────────────── */}
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
        </Section>

        {/* ─────────────────────────  4. THE FOUR EXITS  ───────────────────────── */}
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

        {/* ─────────────────────────  5. MVP SCOPE  ───────────────────────── */}
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

        {/* ─────────────────────────  6. REAL VS STUBBED  ───────────────────────── */}
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
                <StubRow what="Workflow engine" real="Next.js routing + state machine + immutable updates" stubbed="None" />
                <StubRow what="Clause checker" real="Deterministic typed rules engine over ClauseRule[]" stubbed="Claude API (one-file swap when ready)" />
                <StubRow what="Routing engine" real="13 typed rules + computeRouting() with channel collision + committee logic" stubbed="None" />
                <StubRow what="DocuSign send" real="Real envelope JSON shown in preview modal" stubbed="DocuSign REST API call" />
                <StubRow what="Slack notifications" real="Audit-trail events for every Slack action with realistic message body" stubbed="chat.postMessage with interactive buttons" />
                <StubRow what="Writeback" real="Structured payload generated per document type" stubbed="HTTP POST to Light ledger / HRIS / cap-table receivers" />
                <StubRow what="Persistence" real="localStorage with versioned schema, immutable updates, Reset-demo button" stubbed="Postgres + S3 + Redis" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ─────────────────────────  7. WHAT I WOULD BUILD NEXT  ───────────────────────── */}
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

        {/* ─────────────────────────  8. WHERE V2 GOES  ───────────────────────── */}
        <Section title="Where v2 goes" icon={<ArrowRight className="h-4 w-4" />}>
          <p className="text-[13px]">
            If v1 lands inside Light, three moves open up. Each follows directly from the writeback approach.
          </p>
          <ol className="ml-5 list-decimal space-y-2 text-[13px]">
            <li>
              <strong>Light Documents as a customer module.</strong> The same workflow that runs Light&apos;s internal
              contracts becomes a feature Light&apos;s customers turn on. Series A finance teams sign the same kinds of
              MSAs, offers, warrants, and vendor agreements; they need the same writeback into Light&apos;s ledger.
            </li>
            <li>
              <strong>Inbound contracts (counterparty papers).</strong> v1 handles Light-paper-out. v2 handles
              counterparty-paper-in: parse, compare against our master library, flag deviations, route to Legal. This is
              where the Claude clause-checker earns its keep — the deterministic engine handles 80% of the cases; LLM
              comparison covers the long tail.
            </li>
            <li>
              <strong>Renewal and obligation tracking.</strong> Every signed contract carries dates and obligations.
              Calendar alerts at T-90 and T-30 close the loop on revenue retention and vendor cost control. The data is
              already there; v2 is the surface that surfaces it.
            </li>
          </ol>
        </Section>

        {/* ─────────────────────────  9. STATED ASSUMPTIONS  ───────────────────────── */}
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

        {/* ─────────────────────────  10. A NOTE ON THE NAMES  ───────────────────────── */}
        <Section title="A note on the names in this demo" icon={<Users className="h-4 w-4" />}>
          <p className="text-[13px]">
            All personas (Martina Holst as Head of F&amp;O, Sara Friis as in-house counsel, Tom Bauer as the AE, plus
            board members and outside counsel) are illustrative stand-ins. Replace the directory + seed data and the same
            flow runs against Light&apos;s real org chart.
          </p>
        </Section>

        {/* ─────────────────────────  11. TECH STACK  ───────────────────────── */}
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

        {/* ─────────────────────────  12. DECISION PAPER TRAIL  ───────────────────────── */}
        <Section title="The decision paper trail" icon={<BookOpen className="h-4 w-4" />}>
          <p className="text-[13px]">
            The eleven decisions that shaped this build are logged as one-paragraph entries in{" "}
            <a href={DECISIONS_URL} target="_blank" rel="noreferrer" className="text-ink-900 underline">
              docs/decisions.md
            </a>
            . Topics include: keeping DocuSign vs rebuilding signing, the anchor-tag pattern over per-contract drag,
            running deterministic clause rules first and adding the LLM as a refinement, the NDA carve-out from writeback,
            and the routing-engine ownership boundary between Legal and Finance.
          </p>
          <p className="text-[12.5px] text-ink-500">
            Honest framing: this paper trail is for the engineer who inherits the codebase, not the strategist reading the
            submission. The strategist gets the same answers in plain English on the{" "}
            <Link href="/about" className="text-ink-900 underline">
              About page
            </Link>
            .
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

function ExternalLinkPill({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
    >
      {icon}
      {label}
    </a>
  );
}
