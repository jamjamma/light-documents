"use client";

import Link from "next/link";
import { Workflow, Info, Play, ArrowRight } from "lucide-react";

/**
 * Dashboard preamble. Three columns of structured bullets under a tight
 * one-line answer, then two CTAs that mirror the sidebar entries:
 * "About this build" (ink-900 like the sidebar nav active state) and
 * "Take the tour" (accent-tinted like the sidebar tour button).
 */
export function AboutWidget() {
  return (
    <section className="panel tour-anchor-about-widget overflow-hidden">
      <div className="flex items-stretch">
        <div className="hidden w-1 shrink-0 bg-accent-400 sm:block" />
        <div className="flex-1 px-5 py-4">
          {/* Header — explicit demo-only framing so reviewers don't mistake
              this widget for a production-product surface. */}
          <div className="flex items-center gap-2">
            <span className="demo-note">Demo only</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
              <Workflow className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
              About this build
            </span>
          </div>
          <p className="mt-1 text-[11px] text-ink-500">
            Reviewer orientation. A production operator would never see this on the dashboard.
          </p>

          {/* One-line answer — only the verbs are bold so the eye can scan
              the three actions instead of reading a wall of bold text. */}
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-700">
            <strong className="text-ink-900">Wrap</strong> DocuSign.{" "}
            <strong className="text-ink-900">Keep</strong> Word + Drive.{" "}
            <strong className="text-ink-900">Build</strong> the workflow layer between them.
          </p>

          {/* 3-tile structured grid: short, parallel, scannable */}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <BulletTile
              label="Problem"
              text="Manual Word edits and hand-placed DocuSign fields, every contract."
            />
            <BulletTile
              label="Answer"
              text="Templates stay in Word. Anchor tags place fields. Rules engine routes approvals."
            />
            <BulletTile
              label="Wedge"
              text="Signed contracts emit structured data into Light's systems of record."
            />
          </div>

          {/* Two CTAs styled like the sidebar entries. The Tour button is
              desktop-only because the tour (driver.js popovers anchored on
              specific layouts) is hidden on viewports < 768px. On mobile we
              swap it for a small honest hint so a phone user understands the
              gap rather than tapping a dead button. */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-2.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-50"
            >
              <Info className="h-4 w-4 shrink-0" />
              About this build
              <ArrowRight className="h-3 w-3 shrink-0 text-ink-400" />
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("tour:menu-open"));
                }
              }}
              className="hidden items-center gap-2.5 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-[13px] font-medium text-accent-700 transition-colors hover:bg-accent-100 sm:inline-flex"
            >
              <Play className="h-4 w-4 shrink-0" />
              Take the tour
              <span className="text-[10.5px] font-normal text-accent-700/80">~9 min</span>
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-100 bg-ink-50/60 px-2.5 py-1.5 text-[11.5px] text-ink-500 sm:hidden">
              <Play className="h-3 w-3 shrink-0 text-ink-400" />
              Guided tour is desktop-only (~9 min).
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
