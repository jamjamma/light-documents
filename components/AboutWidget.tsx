import { Workflow } from "lucide-react";

/**
 * Dashboard preamble. Intentionally quiet: orients first-time reviewers to
 * what this build is, without a primary CTA pulling attention from the
 * dashboard itself.
 *
 * The widget points back to the sidebar for both deeper reads:
 *   - "About this build" in the sidebar = the full memo
 *   - "Take the Tour" in the sidebar    = the 9-minute guided walk-through
 *
 * The tour is framed as the time-saver, not as competition with the docs.
 */
export function AboutWidget() {
  return (
    <section className="panel tour-anchor-about-widget overflow-hidden">
      <div className="flex items-stretch">
        <div className="hidden w-1 shrink-0 bg-accent-400 sm:block" />
        <div className="flex-1 px-5 py-4">
          {/* Header */}
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-500">
            <Workflow className="h-3.5 w-3.5" />
            About this build
          </div>

          {/* One-line answer */}
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-900">
            <strong>Wrap DocuSign. Keep Word + Drive. Build the workflow layer in between</strong>{" "}
            so commercial contracts emit structured data on signing.
          </p>

          {/* Structured bullet grid */}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <BulletTile
              label="Problem"
              text="Manual Word edits and hand-placed DocuSign fields. This build kills both directly."
            />
            <BulletTile
              label="Answer"
              text="Master templates stay in Word; anchor tags route signature fields automatically; routing engine fires Slack approvals."
            />
            <BulletTile
              label="Wedge"
              text="Every signed contract emits a structured payload (revenue, headcount, cap table) into Light's systems of record. NDAs file for retention only."
            />
          </div>

          {/* Quiet pointer to sidebar — no big CTAs */}
          <p className="mt-3 text-[11.5px] text-ink-500">
            Open <strong className="text-ink-700">About this build</strong> in the sidebar for the full memo.
            The <strong className="text-ink-700">guided tour</strong> in the sidebar walks the build in ~9 minutes,
            built to save you the time of reading.
          </p>
        </div>
      </div>
    </section>
  );
}

function BulletTile({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</div>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-700">{text}</p>
    </div>
  );
}
