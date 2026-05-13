import Link from "next/link";
import { ArrowRight, Workflow } from "lucide-react";

export function AboutWidget() {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-stretch">
        <div className="hidden w-1 shrink-0 bg-accent-400 sm:block" />
        <div className="flex-1 px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-500">
            <Workflow className="h-3.5 w-3.5" />
            About this build
          </div>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-700">
            The real problem isn't document upload. It's <span className="font-semibold text-ink-900">controlled document execution</span>: making sure the right document, with the right terms, is approved by the right people, signed by the right counterparty, and stored with an audit trail that flows back into the Light ledger. This wraps DocuSign for the legally binding signature, and adds the workflow layer Light actually needs.
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
