
import type { Ticket } from "./types";

export type SemanticEvaluation = {
  supported: boolean;
  unsupportedClaims: string[];
};

// Known claim patterns for our synthetic evaluation dataset.
// This is a rule-based demonstration, not a general-purpose
// natural-language inference engine.
const CLAIM_RULES = [
  {
    name: "Reset link expiration",
    claimPattern: /\breset link\b.{0,30}\bexpired\b|\bexpired\b.{0,30}\breset link\b/i,
    evidencePattern: /\breset link\b.{0,30}\bexpired\b|\bexpired\b.{0,30}\breset link\b/i
  },
  {
    name: "Payment gateway outage",
    claimPattern: /\bpayment gateway\b.*\b(unavailable|down|failed|outage)\b/i,
    evidencePattern: /\bpayment gateway\b.*\b(unavailable|down|failed|outage)\b/i
  },
  {
    name: "Account locked",
    claimPattern: /\baccount\b.*\blocked\b/i,
    evidencePattern: /\baccount\b.*\blocked\b/i
  },
  {
    name: "Three failed login attempts",
    claimPattern: /\b(three|3)\s+(failed\s+)?(login|sign[\s-]?in|password)\s+attempts?\b/i,
    evidencePattern: /\b(three|3)\s+(failed\s+)?(login|sign[\s-]?in|password)\s+attempts?\b/i
  }
];

export function evaluateSemanticSupport(
  summary: string,
  ticket: Ticket,
  sourceIds: string[]
): SemanticEvaluation {
  const citedMessages = ticket.messages
    .filter(message => sourceIds.includes(message.id))
    .map(message => message.text)
    .join(" ");

  const unsupportedClaims: string[] = [];

  for (const rule of CLAIM_RULES) {
    if (rule.claimPattern.test(summary)) {
      if (!rule.evidencePattern.test(citedMessages)) {
        unsupportedClaims.push(rule.name);
      }
    }
  }

  return {
    supported: unsupportedClaims.length === 0,
    unsupportedClaims
  };
}