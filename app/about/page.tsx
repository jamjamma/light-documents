import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Workflow, Target, Shield, Database, Users, FileType2, AlertTriangle } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Header
        title="About this build"
        subtitle="Submission memo for the AI Strategy & Operations Associate case study at Light"
      />
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <Section title="The problem" icon={<Target className="h-4 w-4" />}>
          <p>
            The stated pain (manual Word edits and hand-placed DocuSign fields) is real, and the workflow below kills
            both directly.
          </p>
          <p>
            While we are rebuilding the flow, there is a strategic opportunity uniquely available to Light: every signed contract
            is structured data (revenue, headcount, equity, vendor obligations) that belongs in the systems of record.
            The PDF is the audit artifact; the data is the product. Other CLMs ship integrations into N ERPs. Light{" "}
            <em>is</em> the ERP.
          </p>
        </Section>

        <Section title="Build vs buy" icon={<Workflow className="h-4 w-4" />}>
          <table>
            <thead>
              <tr className="border-b border-ink-100">
                <th className="py-2 pr-3">Layer</th>
                <th className="py-2 pr-3">Decision</th>
                <th className="py-2">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-[13px]">
              <BvBRow layer="E-signature + identity + audit trail" decision="Buy / keep DocuSign" why="eIDAS QES in EU, ESIGN in US, court-tested. Not our edge." />
              <BvBRow layer="Template authoring" decision="Keep Word + Drive" why="Legal counsel will not adopt a new editor. We read templates from Drive, we do not host editing." />
              <BvBRow layer="Full CLM (Ironclad, Juro, SpotDraft)" decision="Defer, not dismiss" why="Juro and SpotDraft now target Series A SaaS in Europe with SMB pricing and ~30-day implementations. A pilot would cover ~70% of this workflow. The 30% they don't cover is the strategic wedge: writeback into Light's ledger, routing rules owned by Head of F&O, integration with the source records Light's customers already trust. Revisit at 500+ / mo." />
              <BvBRow layer="Workflow layer (intake, validation, approval, generation, send orchestration, ledger writeback)" decision="Build" why="This is the gap, and the gap Light's ERP wedge is uniquely positioned to fill." />
            </tbody>
          </table>
        </Section>

        <Section title="The one key decision walked through" icon={<Shield className="h-4 w-4" />}>
          <p>
            <strong>Wrap DocuSign as infrastructure. Make contracts first-class structured data, not files.</strong>
          </p>
          <p>Three reasons:</p>
          <ol className="ml-5 list-decimal space-y-1.5 text-[13px]">
            <li>
              <strong>Legal.</strong> Rebuilding the signing layer means inheriting eIDAS, ESIGN, UETA, authority-to-bind
              verification, witnessing rules, and a decade of case-law compliance. Wrong battle for a Series A finance
              company.
            </li>
            <li>
              <strong>Adoption.</strong> Legal counsel authors contracts in Word. Forcing them into a new editor kills the
              rollout. We read what they write, we do not replace where they write.
            </li>
            <li>
              <strong>Strategic fit for Light.</strong> Contracts are streams of structured data (revenue, headcount,
              equity, vendor obligations) that belong in the systems of record Light already operates. The PDF is the
              audit artifact. This is the contract approach that matches Light's product thesis, and it lets "Light
              Documents" ship as a customer-facing module after internal use proves it.
            </li>
          </ol>
          <p className="text-[13px] text-ink-500">
            Smallest technical embodiment: DocuSign anchor tags embedded in templates as white-on-white text, paired
            with typed variables. Collapses "manually drag signature fields" from ~5 minutes per doc to zero,
            deterministically, without writing any signing code ourselves.
          </p>
        </Section>

        <Section title="How the Legal team keeps Word" icon={<FileType2 className="h-4 w-4" />}>
          <p>
            Master templates stay as Word docs in Google Drive (or SharePoint), owned by the Legal team.
            <span className="text-ink-500"> In this demo that role is illustrated by Sara Friis, in-house counsel (a stand-in persona, see note below).</span>{" "}
            Legal types{" "}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">{`{{counterparty.legal_name}}`}</code>{" "}
            and <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">{`\\sig:counterparty\\`}</code>{" "}
            directly into the document as text. On save, Drive webhooks our platform. We parse the docx (zip of XML),
            extract variables and anchor tags, version-pin at contract create time.
          </p>
          <p className="text-[13px] text-ink-500">
            <strong className="text-ink-700">Legal keeps Word, not us.</strong>{" "}
            Counsel never has to open Light Documents. They edit master templates the same way they do today:
            Word in Drive, with Track Changes and comments. Our platform watches that folder via the Drive Watch API
            and syncs the latest version automatically. No new editor, no new login, no migration. Everyone else
            (Sales, People Ops, Finance) uses Light Documents to <em>execute</em> against those templates.
          </p>
          <p className="text-[13px] text-ink-500">
            Per-contract substitution uses <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">docxtemplater</code>{" "}
            (Node) or python-docx. Output is still a valid docx, opens in Word. Anchor tags are formatted as white-on-white
            text so invisible to signers but findable by DocuSign API <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px]">searchString</code> tabs.
          </p>
        </Section>

        <Section title="Cross-functional design" icon={<Users className="h-4 w-4" />}>
          <p>
            The workflow layer sits between source systems and execution systems. Templates from Drive. Source records
            from Salesforce / HubSpot / Attio / Personio / Ashby / Workday / Manual entry. Signing through DocuSign.
            Notifications through Slack (DM for action, channel for awareness) plus email magic links for board and
            external counsel. Approver chain is rule-based with reasons attached. Ledger writeback closes the loop on
            MRR, headcount, cap table, and vendor records.
          </p>
          <p className="text-[13px] text-ink-500">
            The Head of Finance & Operations role (the role this case is for) owns the routing rules engine. Sees
            everything. Can override anything. Designed for the operating heartbeat of a hypergrowth company.
          </p>
        </Section>

        <Section title="MVP scope (what is built here)" icon={<Database className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="demo-note mb-2">In scope</div>
              <ul className="space-y-1 text-[13px]">
                <li>• 8 document templates with clause rules + DocuSign config + conditional sections</li>
                <li>• Structured intake form (adapts to template type)</li>
                <li>• Clause check engine (deterministic stand-in; production swaps in Claude with the same output shape)</li>
                <li>• Rule-based approval routing with channels (Slack / email)</li>
                <li>• DocuSign envelope preview with anchor-tag placement</li>
                <li>• Signed record with audit trail + writeback to systems of record</li>
                <li>• Dashboard with KPIs and filter chips</li>
                <li>• 3 Light entities (assumed): Denmark, UK, US Delaware</li>
              </ul>
            </div>
            <div>
              <div className="demo-note mb-2">Out of scope (Phase 2+)</div>
              <ul className="space-y-1 text-[13px]">
                <li>• Real DocuSign eSignature REST API integration</li>
                <li>• Real LLM for clause comparison (Claude API)</li>
                <li>• Real Slack bot for interactive approvals</li>
                <li>• OAuth integrations for Salesforce, HubSpot, etc.</li>
                <li>• Counterparty redline portal</li>
                <li>• Renewal and obligation tracking with calendar alerts</li>
                <li>• Inbound vendor contracts</li>
                <li>• Customer-facing module (after internal use)</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="What I would build next (90 days)" icon={<Workflow className="h-4 w-4" />}>
          <table>
            <thead>
              <tr className="border-b border-ink-100">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Integration</th>
                <th className="py-2">Why first</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-[13px]">
              <NextRow n="1" what="Slack (interactive approvals)" why="Everyone is in Slack. Zero new tool to learn. The adoption gate." />
              <NextRow n="2" what="Light writeback (ledger / HRIS / cap table)" why="The strategic moat. Light's wedge made operational. Built in parallel with Slack so the first signed contract lands in a system of record, not just in Drive." />
              <NextRow n="3" what="Salesforce + HubSpot deal read" why="30 to 50 contracts / mo originate from Sales." />
              <NextRow n="4" what="DocuSign API (real envelopes + Connect webhooks)" why="Replaces simulated send. Well-documented API. Low risk." />
              <NextRow n="5" what="HRIS read (Personio, Ashby, Workday)" why="10 to 20 contracts / mo from People Ops." />
              <NextRow n="6" what="Drive / SharePoint template sync" why="Replaces ad-hoc folder. Required for version control + compliance." />
              <NextRow n="7" what="Email magic links" why="Handles board, external counsel, non-Slack users." />
              <NextRow n="8" what="Calendar alerts for renewals" why="Closes the loop on obligations." />
            </tbody>
          </table>
        </Section>

        <Section title="Stated assumptions" icon={<AlertTriangle className="h-4 w-4" />}>
          <ol className="ml-5 list-decimal space-y-1.5 text-[13px]">
            <li>Light has master Word templates in Drive (or SharePoint) owned by Legal and People, but they are not connected to source systems.</li>
            <li>DocuSign is the existing signing tool. May have partial template / AutoPlace usage, but inconsistent.</li>
            <li>Source data lives in Salesforce or HubSpot (deals), an HRIS (employees), and Light's own ledger (vendors, cap table).</li>
            <li>Approvers are real humans on Slack. Routing rules are owned by Head of Finance & Ops.</li>
            <li>Volume is the stated 50-100 / month. CLM-scale tools are overkill for this throughput.</li>
          </ol>
        </Section>

        <Section title="A note on the names in this demo" icon={<Users className="h-4 w-4" />}>
          <p>
            All personas (Martina Holst as Head of F&amp;O, Sara Friis as in-house counsel, Tom Bauer as the AE, board
            members, outside counsel) are illustrative stand-ins. Replace the directory + seed data and the same flow
            runs against Light's real org chart.
          </p>
        </Section>

        <Section title="Tech stack" icon={<Database className="h-4 w-4" />}>
          <p>
            Next.js 15 App Router, TypeScript strict, Tailwind 3.4, lucide-react icons. No backend in this prototype:
            state in localStorage with a real state machine and immutable updates. In production: Postgres, Redis queue,
            S3 / GCS for signed PDFs, Vercel or AWS hosting, SSO via Google Workspace or Okta.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="slate">Next.js 15</Badge>
            <Badge tone="slate">TypeScript strict</Badge>
            <Badge tone="slate">Tailwind 3.4</Badge>
            <Badge tone="slate">React 19</Badge>
            <Badge tone="slate">localStorage state</Badge>
            <Badge tone="slate">No backend in prototype</Badge>
          </div>
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
      <td className="py-2 pr-3 align-top font-medium text-ink-900">{layer}</td>
      <td className="py-2 pr-3 align-top">{decision}</td>
      <td className="py-2 align-top text-ink-600">{why}</td>
    </tr>
  );
}

function NextRow({ n, what, why }: { n: string; what: string; why: string }) {
  return (
    <tr>
      <td className="py-2 pr-3 align-top font-mono text-[12px] text-ink-500">{n}</td>
      <td className="py-2 pr-3 align-top font-medium text-ink-900">{what}</td>
      <td className="py-2 align-top text-ink-600">{why}</td>
    </tr>
  );
}
