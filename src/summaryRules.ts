
import type { Ticket } from "./types";

export type SummaryCandidate = {
  summary?: unknown;
  sourceIds?: unknown;
};

export type Evaluation = {
  eligible: boolean;
  reasons: string[];
};

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE = /(?:\+?\d[\d ().-]{7,}\d)/;

export function evaluateSummary(
  candidate: SummaryCandidate,
  ticket: Ticket
): Evaluation {
  const reasons: string[] = [];

  // Validate summary content
  const text =
    typeof candidate.summary === "string"
      ? candidate.summary.trim()
      : "";

  if (!text) {
    reasons.push("Summary is missing or empty.");
  }

  // Validate citation structure
  const rawIds = candidate.sourceIds;

  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    reasons.push("At least one source citation is required.");
  }

  const ids: string[] = Array.isArray(rawIds)
    ? rawIds.filter((id): id is string => typeof id === "string")
    : [];

  if (Array.isArray(rawIds) && ids.length !== rawIds.length) {
    reasons.push("One or more source IDs have an invalid format.");
  }

  if (ids.some(id => !id.trim())) {
    reasons.push("Source IDs cannot be empty.");
  }

  // Validate duplicate citations
  if (new Set(ids).size !== ids.length) {
    reasons.push("Duplicate source citations are not allowed.");
  }

  // Validate ticket ownership
  const allowedIds = new Set(
    ticket.messages.map(message => message.id)
  );

  if (ids.some(id => !allowedIds.has(id))) {
    reasons.push(
      "One or more citations do not belong to this ticket."
    );
  }

  // Validate sensitive information
  if (EMAIL.test(text) || PHONE.test(text)) {
    reasons.push(
      "Summary may expose personal contact information."
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
}