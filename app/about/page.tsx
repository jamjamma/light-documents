import Link from "next/link";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import {
  Target,
  Shield,
  FileType2,
  Github,
  FileText,
  PlayCircle,
  ListChecks,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const REPO_URL = "https://github.com/jamjamma/light-documents";
const README_URL = `${REPO_URL}/blob/main/README.md`;
const PART_2_URL = `${REPO_URL}/blob/main/case-study/PART-2-COHORT-ANALYSIS.md`;
const PART_3_URL = `${REPO_URL}/blob/main/case-study/PART-3-DAY-ONE.md`;

export default function AboutPage() {
  return (
    <>
      <Header
        title="About this build"
        subtitle="Submission memo for the AI Strategy & Operations Associate case study at Light"
      />
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">

        {/* ─────────────────────────  0. ONE-LINE NAV  ───────────────────────── */}
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-[13px] text-ink-600">
              <div className="flex items-center gap-1.5 font-medium text-ink-900">
                <BookOpen className="h-3.5 w-3.5" />
                You are reading the skim version
              </div>
              <p className="mt-1 text-ink-500">
                Five-minute read. For build vs buy, scope, what is stubbed, and what ships in 90 days, see the deeper page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Link
                href="/about/build-notes"
                className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-2.5 py-1 text-[11.5px] font-medium text-white transition-colors hover:bg-ink-800"
              >
                <FileText className="h-3 w-3" />
                Build notes
              </Link>
              <ExternalLinkPill href={REPO_URL} icon={<Github className="h-3 w-3" />} label="Repo" />
              <ExternalLinkPill href={README_URL} label="README" />
            </div>
          </div>
        </Card>

        {/* ─────────────────────────  1. PROBLEM + REFRAME  ───────────────────────── */}
        <Section title="The problem, and the reframe" icon={<Target className="h-4 w-4" />}>
          <p>
            The stated pain (manual Word edits and hand-placed DocuSign fields) is real. The workflow below kills both directly.
          </p>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5 text-[13px] leading-relaxed">
            <div className="demo-note mb-2">The reframe</div>
            <ul className="space-y-2 text-ink-700">
              <li className="flex gap-2">
                <span className="text-ink-400">•</span>
                <span>
                  <strong>Commercial contracts carry structured data.</strong> MSAs and Order Forms → revenue and billing.
                  Employment → headcount. Warrants → cap table. Vendor → AP.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-ink-400">•</span>
                <span>
                  <strong>NDAs are the exception.</strong> No commercial value to post. They file for retention only.
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
            <p className="mt-2.5 text-ink-600">
              The PDF is the audit artifact, the data is the product. That is the potential wedge, if Light wants to operationalise it.
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
            <li className="flex gap-2"><span className="text-ink-400">•</span><span>The work happens in the gap; that is the part Light could uniquely own if it chose to.</span></li>
          </ul>
        </Section>

        {/* ─────────────────────────  3. WHAT TO TRY IN 60 SECONDS  ───────────────────────── */}
        <Section title="What to try in 60 seconds" icon={<PlayCircle className="h-4 w-4" />}>
          <p className="text-[13px]">
            The build runs in a browser with no backend. Pick one path; each takes about a minute.
          </p>
          <ol className="ml-5 list-decimal space-y-2 text-[13px]">
            <li>
              <strong>The hero path.</strong>{" "}
              <Link href="/contracts/c_bolt_msa" className="text-ink-900 underline">
                Open the Bolt MSA contract
              </Link>
              . You land mid-workflow: clause check ran, approval chain routed to three approvers. Approve, then simulate
              the other two. Click Preview envelope to see anchor tags placing signature fields automatically.
            </li>
            <li>
              <strong>The governance path.</strong>{" "}
              <Link href="/templates" className="text-ink-900 underline">
                Open the Templates page
              </Link>
              . The Counsel callout explains who owns what. Expand the Rogue templates panel to see how Drive-side drift
              gets caught: pick Archive or Notify owner on a flagged file.
            </li>
            <li>
              <strong>End to end.</strong>{" "}
              <Link href="/contracts/new" className="text-ink-900 underline">
                Start a new contract
              </Link>
              . Three steps: template, source record, confirm. Run checks creates the contract; the same engine you saw
              on Bolt MSA fires again.
            </li>
          </ol>
          <div className="rounded-lg border border-ink-100 bg-white p-3 text-[12.5px] text-ink-500">
            <div className="demo-note mb-1">Faster option</div>
            Open the chapter chooser from the sidebar (Take the Tour). Walk everything in ~9 minutes or pick one of six
            chapters. The tour drives the same surfaces above with popovers explaining what each piece does.
          </div>
        </Section>

        {/* ─────────────────────────  4. FIVE KEY DECISIONS  ───────────────────────── */}
        <Section title="Five key decisions" icon={<ListChecks className="h-4 w-4" />}>
          <p className="text-[13px]">
            The full build-vs-buy table and the rest of the paper trail live on the{" "}
            <Link href="/about/build-notes" className="text-ink-900 underline">
              build notes page
            </Link>
            . Here is the short prose version.
          </p>
          <ol className="ml-5 list-decimal space-y-2.5 text-[13px]">
            <li>
              <strong>Keep DocuSign. Don&apos;t rebuild signing.</strong> eIDAS, ESIGN, identity verification, and audit
              trail are commodity. Rebuilding them is the wrong battle for a Series A finance company.
            </li>
            <li>
              <strong>Keep Word + Drive for authoring.</strong> Forcing legal counsel into a new editor is the single
              largest failure mode for CLM rollouts. We read what they write; we don&apos;t replace where they write.
            </li>
            <li>
              <strong>Defer full CLM, don&apos;t dismiss it.</strong> Juro and SpotDraft cover ~70% of this workflow.
              The 30% they don&apos;t cover is where Light could differentiate: writeback into Light&apos;s ledger,
              Finance-owned routing, source-system integration. Revisit at 500+ contracts / month.
            </li>
            <li>
              <strong>Deterministic clause rules now, Claude later.</strong> A typed rules engine over{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[11.5px]">ClauseRule[]</code> handles 80%
              of cases reliably and cheaply. The LLM swap is a one-file change because the contract with the UI is the
              result shape, not the engine.
            </li>
            <li>
              <strong>Anchor tags over per-contract dragging.</strong> Counsel types{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[11.5px]">{`\\sig:counterparty\\`}</code>{" "}
              once into the master. DocuSign&apos;s API finds it via searchString. Zero per-contract field placement.
              The smallest technical embodiment of the whole thesis.
            </li>
          </ol>
        </Section>

        {/* ─────────────────────────  5. HOW THE LEGAL TEAM KEEPS WORD  ───────────────────────── */}
        <Section title="How the Legal team keeps Word" icon={<FileType2 className="h-4 w-4" />}>
          <p className="text-[13px]">
            The adoption story in three steps. The full mechanism (docx parsing, version pinning, substitution) is on the{" "}
            <Link href="/about/build-notes" className="text-ink-900 underline">
              build notes page
            </Link>
            .
          </p>
          <ul className="space-y-2 text-[13px]">
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">1.</span>
              <span>Master templates stay as Word docs in Drive, owned by Legal. They type variables and anchor tags directly into the document as text.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">2.</span>
              <span>On save, our platform parses the docx and version-pins it. New contracts substitute against the pinned version.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-ink-400">3.</span>
              <span>Counsel may still log in to approve a clause deviation when one is flagged. Authoring stays in Word; review happens here.</span>
            </li>
          </ul>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-[12.5px] text-ink-600">
            <strong className="text-ink-900">Why this is load-bearing.</strong> Forcing counsel into a new editor is the
            single largest reason CLM rollouts fail. Everything else in the build is downstream of getting this right.
          </div>
        </Section>

        {/* ─────────────────────────  6. READ MORE  ───────────────────────── */}
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-900">
              <ArrowRight className="h-3.5 w-3.5" />
              Read more
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ReadMoreTile
                href="/about/build-notes"
                title="Build notes"
                detail="Build vs buy table, MVP scope, what is real vs stubbed, the 90-day rollout, the v2 sketch."
                internal
              />
              <ReadMoreTile
                href={PART_2_URL}
                title="Case Part 2: Cohort analysis"
                detail="Segmentation, recommendation, and how the cohorts map onto the build decisions visible in this demo."
              />
              <ReadMoreTile
                href={PART_3_URL}
                title="Case Part 3: Day-one plan"
                detail="The 30/60/90. Rooted in surfaces you have already touched in the demo."
              />
              <ReadMoreTile
                href={REPO_URL}
                title="Repo on GitHub"
                detail="Code, the docs/decisions.md paper trail for the technical reviewer, full project map."
              />
            </div>
          </div>
        </Card>

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

function ReadMoreTile({
  href,
  title,
  detail,
  internal,
}: {
  href: string;
  title: string;
  detail: string;
  internal?: boolean;
}) {
  const className =
    "block rounded-lg border border-ink-100 bg-white p-3 transition-colors hover:border-ink-200 hover:bg-ink-50/40";
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
        {title}
        <ArrowRight className="h-3 w-3 text-ink-400" />
      </div>
      <div className="mt-1 text-[12.5px] text-ink-600">{detail}</div>
    </>
  );
  if (internal) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {body}
    </a>
  );
}
