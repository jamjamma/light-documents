import type { Template, ContractFields, ClauseCheckResult } from "./types";

/**
 * Runs all clause rules attached to a template against the provided contract fields.
 * Pure function: same inputs produce same outputs. No I/O, no side effects.
 *
 * In production this would call Claude with the master template text and the
 * generated document, asking for clause-by-clause comparison. The deterministic
 * rules engine here produces the same SHAPE of output, which is what the UI
 * binds to. Swapping the implementation is a one-file change.
 */
export function runChecks(template: Template, fields: ContractFields): ClauseCheckResult[] {
  return template.clauseRules.map((rule) => {
    const isStandard = rule.predicate(fields);
    return {
      key: rule.key,
      label: rule.label,
      expected: rule.expected,
      observed: rule.observed(fields),
      status: isStandard ? "standard" : "deviation",
      severity: rule.severity,
      reason: isStandard ? undefined : rule.reason,
    };
  });
}

export function countDeviations(results: ClauseCheckResult[]): number {
  return results.filter((r) => r.status === "deviation").length;
}

export function hasBlockingDeviation(results: ClauseCheckResult[]): boolean {
  return results.some((r) => r.status === "deviation" && r.severity === "block");
}

export function allStandard(results: ClauseCheckResult[]): boolean {
  return results.every((r) => r.status === "standard");
}

export function summarizeChecks(results: ClauseCheckResult[]): string {
  const total = results.length;
  const matching = results.filter((r) => r.status === "standard").length;
  const deviations = total - matching;
  if (deviations === 0) return `All ${total} clauses match master template.`;
  return `${matching} of ${total} clauses match master. ${deviations} deviation${deviations === 1 ? "" : "s"} flagged.`;
}
