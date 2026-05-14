import Link from "next/link";
import { ArrowRight, Workflow } from "lucide-react";

/**
 * Dashboard preamble that orients first-time reviewers to what this build is.
 *
 * Intentionally simple: one paragraph stating the strategic answer, one link
 * to the full memo. No CTAs (those live in the dashboard callout and the
 * sidebar). No "TRY:" hints (the guided tour handles teaching the surface).
 */
export function AboutWidget() {
  return (
    <section className="panel tour-anchor-about-widget overflow-hidden">
      <div className="flex items-stretch">
        <div className="hidden w-1 shrink-0 bg-accent-400 sm:block" />
        <div className="flex-1 px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-500">
            <Workflow className="h-3.5 w-3.5" />
            About this build
          </div>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-700">
            The stated pain (manual Word edits and hand-placed DocuSign fields) is real, and this build kills both
            directly. While we&apos;re in there, every signed contract becomes structured data that flows back into
            the system of record. The PDF is the audit artifact; the data is the product.
          </p>

          <Link
            href="/about"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-ink-900 hover:text-accent-700"
          >
            Read the full submission memo
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
