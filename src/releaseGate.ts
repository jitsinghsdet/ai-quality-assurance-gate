
import type { Ticket } from "./types";
import {
  evaluateSummary,
  type SummaryCandidate,
  type Evaluation
} from "./summaryRules";
import {
  evaluateSemanticSupport,
  type SemanticEvaluation
} from "./semanticRules";

export type ReleaseEvaluation = {
  eligible: boolean;
  reasons: string[];
  structural: Evaluation;
  semantic: SemanticEvaluation;
};

export function evaluateReleaseCandidate(
  candidate: SummaryCandidate,
  ticket: Ticket
): ReleaseEvaluation {
  // Layer 1: Structural validation
  const structural = evaluateSummary(candidate, ticket);

  // Safely normalize untrusted candidate data before semantic evaluation.
  const summary =
    typeof candidate.summary === "string"
      ? candidate.summary
      : "";

  const sourceIds = Array.isArray(candidate.sourceIds)
    ? candidate.sourceIds.filter(
        (id): id is string => typeof id === "string"
      )
    : [];

  // Layer 2: Semantic evidence validation
  const semantic = evaluateSemanticSupport(
    summary,
    ticket,
    sourceIds
  );

  // Consolidate all release-blocking findings.
  const reasons = [
    ...structural.reasons,
    ...semantic.unsupportedClaims.map(
      claim => `Unsupported claim: ${claim}.`
    )
  ];

  return {
    eligible: structural.eligible && semantic.supported,
    reasons,
    structural,
    semantic
  };
}