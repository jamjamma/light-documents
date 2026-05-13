/**
 * Shared template-display metadata (data-only).
 *
 * Three pages render template cards: the Templates catalog, the new-contract
 * step 1 picker, and the rogue-templates panel. This module is the single
 * source for category, blurbs, pill colors, and recency calculation.
 *
 * Icons live in ./template-meta-icons.tsx so this file stays JSX-free and is
 * safe to import from Node-side scripts (tests, codegen).
 */

import type { Template, TemplateId } from "./types";

export type Category = "Customer contracts" | "People" | "Equity";

export const CATEGORY_ORDER: Category[] = ["Customer contracts", "People", "Equity"];

export const TEMPLATE_CATEGORY: Record<TemplateId, Category> = {
  nda_v3_1: "Customer contracts",
  msa_v4_2: "Customer contracts",
  msa_pilot_v1_0: "Customer contracts",
  order_form_v2_0: "Customer contracts",
  employment_dk_v2_0: "People",
  employment_uk_v1_0: "People",
  warrant_v1_5: "Equity",
  warrant_advisor_v1_0: "Equity",
};

/** Tailwind classes for the category pill (bg + text + ring), keyed by category. */
export const CATEGORY_PILL: Record<Category, string> = {
  "Customer contracts": "bg-blue-50 text-blue-700 ring-blue-200",
  People: "bg-teal-50 text-teal-700 ring-teal-200",
  Equity: "bg-accent-50 text-accent-700 ring-accent-200",
};

/** Alias for callers that want section-header accent styling. */
export const CATEGORY_ACCENT: Record<Category, string> = CATEGORY_PILL;

export const CATEGORY_BLURB: Record<Category, string> = {
  "Customer contracts": "Owned by Sales + Legal. NDAs, MSAs, pilot agreements, order forms.",
  People: "Owned by People Ops + Legal. Employment contracts by jurisdiction.",
  Equity: "Owned by CFO + Legal + Board. Warrants and equity grants.",
};

export function categoryFor(templateId: TemplateId): Category {
  return TEMPLATE_CATEGORY[templateId];
}

// ── Recency indicator ─────────────────────────────────────────────────────────

const RECENT_UPDATE_WINDOW_DAYS = 90;
const NEW_TEMPLATE_WINDOW_DAYS = 90;

export interface RecentUpdateInfo {
  /** "Updated 3 weeks ago" or "New template" */
  label: string;
  /** Tailwind classes for the chip. */
  classes: string;
  /** The current version's change note. Used by hover/tooltip and detail modal. */
  changeNote: string;
  /** Variant for styling: "new" highlights stronger than "updated". */
  variant: "new" | "updated";
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeUpdateLabel(daysAgo: number): string {
  if (daysAgo <= 1) return "Updated today";
  if (daysAgo <= 6) return `Updated ${daysAgo} days ago`;
  const weeks = Math.round(daysAgo / 7);
  if (weeks <= 4) return `Updated ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.round(daysAgo / 30);
  return `Updated ${months} month${months === 1 ? "" : "s"} ago`;
}

/**
 * Returns a recency badge for a template if its current version was released
 * within the recent-update window. Templates whose current version is v1.0
 * within that window get the brighter "New template" variant so they stand
 * out as additions to the catalog rather than incremental updates.
 *
 * Pure function: callers pass `asOf` for testability; defaults to today.
 */
export function recentUpdateInfo(template: Template, asOf: Date = new Date()): RecentUpdateInfo | null {
  const current = template.versionHistory?.find((v) => v.status === "current");
  if (!current) return null;
  const released = new Date(current.releasedAt);
  if (Number.isNaN(released.getTime())) return null;
  const days = daysBetween(released, asOf);
  if (days < 0) return null;

  const isV1 = /^v?1\.0$/i.test(current.version);
  if (isV1 && days <= NEW_TEMPLATE_WINDOW_DAYS) {
    return {
      label: `New template · ${relativeUpdateLabel(days).replace(/^Updated /, "")}`,
      classes: "bg-accent-50 text-accent-700 ring-accent-200",
      changeNote: current.changeNote,
      variant: "new",
    };
  }
  if (days <= RECENT_UPDATE_WINDOW_DAYS) {
    return {
      label: relativeUpdateLabel(days),
      classes: "bg-sage-50 text-sage-500 ring-sage-500/30",
      changeNote: current.changeNote,
      variant: "updated",
    };
  }
  return null;
}
