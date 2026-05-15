/**
 * Centralised company policy data.
 *
 * Why this file exists: the same governing-law allow-list and the same salary
 * bands were duplicated in 3 places (routing-rules.ts, IntakeForm.tsx, and the
 * mock-data EU country list). That drift is a real bug: a UI warning could
 * disagree with what actually triggers Counsel review. This module is the single
 * source of truth.
 *
 * In production this lives in a settings table editable by the Head of Finance
 * & Ops (governing law) and the Head of People (salary bands). The shape mirrors
 * what a settings UI would write.
 */

import type { Jurisdiction } from "./types";

// ── Governing law ──────────────────────────────────────────────────────────────

export const EU_COUNTRIES: readonly string[] = [
  "denmark",
  "germany",
  "france",
  "ireland",
  "netherlands",
  "sweden",
  "finland",
  "norway",
  "spain",
  "italy",
];

export const UK_VARIANTS: readonly string[] = [
  "united kingdom",
  "england",
  "england and wales",
  "uk",
];

/**
 * Governing laws that do not require Counsel review. EU member states + UK.
 * Anything else routes to Counsel regardless of doc type.
 */
export const ACCEPTED_GOVERNING_LAWS: readonly string[] = [
  ...EU_COUNTRIES,
  ...UK_VARIANTS,
];

export function isAcceptedLaw(law: string | undefined | null): boolean {
  if (!law) return false;
  const lower = law.toLowerCase();
  return ACCEPTED_GOVERNING_LAWS.some((accepted) => lower.includes(accepted));
}

// ── Salary bands ───────────────────────────────────────────────────────────────

export interface SalaryBand {
  min: number;
  max: number;
}

/**
 * Salary bands keyed by jurisdiction × role. EUR annual base.
 *
 * UK bands are not literally lower (London cost-of-living is comparable to
 * Copenhagen), but they reflect a different market structure: tighter spreads,
 * higher variable for VP roles, slightly lower base for individual contributors.
 * In production the Head of People owns these numbers and reviews them annually.
 */
export const SALARY_BANDS: Record<Jurisdiction, Record<string, SalaryBand>> = {
  DK: {
    "Senior Engineer": { min: 80_000, max: 115_000 },
    "Engineering Manager": { min: 110_000, max: 145_000 },
    "VP Sales": { min: 130_000, max: 155_000 },
    "VP Engineering": { min: 150_000, max: 185_000 },
    "Director Marketing": { min: 110_000, max: 140_000 },
  },
  UK: {
    "Senior Engineer": { min: 75_000, max: 110_000 },
    "Engineering Manager": { min: 100_000, max: 140_000 },
    "VP Sales": { min: 125_000, max: 160_000 },
    "VP Engineering": { min: 145_000, max: 180_000 },
    "Director Marketing": { min: 105_000, max: 135_000 },
  },
  US: {
    // EUR-equivalent bands for US Delaware hires. Used by Light Inc. roles.
    "Senior Engineer": { min: 130_000, max: 175_000 },
    "Engineering Manager": { min: 160_000, max: 210_000 },
    "VP Sales": { min: 180_000, max: 230_000 },
    "VP Engineering": { min: 200_000, max: 260_000 },
    "Director Marketing": { min: 150_000, max: 195_000 },
  },
};

export function getSalaryBand(
  role: string | undefined,
  jurisdiction: Jurisdiction = "DK",
): SalaryBand | undefined {
  if (!role) return undefined;
  return SALARY_BANDS[jurisdiction]?.[role];
}

export function isSalaryAboveBand(
  role: string | undefined,
  salary: number | undefined,
  jurisdiction: Jurisdiction = "DK",
): boolean {
  if (!role || salary === undefined) return false;
  const band = getSalaryBand(role, jurisdiction);
  if (!band) return false;
  return salary > band.max;
}

// ── Light entities ─────────────────────────────────────────────────────────────

export const LIGHT_ENTITY_TO_JURISDICTION: Record<string, Jurisdiction> = {
  "Light ApS (Denmark)": "DK",
  "Light Ltd (United Kingdom)": "UK",
  "Light Inc. (US Delaware)": "US",
};

export function jurisdictionForEntity(entity: string | undefined): Jurisdiction {
  if (!entity) return "DK";
  return LIGHT_ENTITY_TO_JURISDICTION[entity] ?? "DK";
}
