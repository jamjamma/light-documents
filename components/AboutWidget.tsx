"use client";

import Link from "next/link";
import { ArrowRight, Play, FileText, Workflow } from "lucide-react";

/**
 * Dashboard preamble. Orients first-time reviewers to what this build is and
 * gives them two ways forward: read the memo, or take the guided tour.
 *
 * Structured layout (instead of one long paragraph): icon-led tag at top,
 * one-line answer, three bullet rows (problem / answer / wedge), two CTAs.
 * Matches the visual hierarchy used on the /about page so the dashboard
 * and the memo read as one product.
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

          {/* Two CTAs */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-ink-800"
            >
              <FileText className="h-3.5 w-3.5" />
              Read the submission memo
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("tour:menu-open"));
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-accent-300 bg-accent-50 px-3 py-1.5 text-[12px] font-medium text-accent-700 transition-colors hover:bg-accent-100"
            >
              <Play className="h-3.5 w-3.5" />
              Take the tour
              <span className="text-[10.5px] font-normal text-accent-700/80">~9 min</span>
            </button>
            <span className="text-[11px] text-ink-400">
              The tour is faster than reading.
            </span>
          </div>
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
