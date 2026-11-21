
import { describe, expect, it } from "vitest";
import { evaluateReleaseCandidate } from "../src/releaseGate";
import { currentTicket } from "../src/ticket";

describe("combined AI summary release gate", () => {
  it("allows a structurally valid and semantically supported summary", () => {
    const result = evaluateReleaseCandidate(
      {
        summary: "Customer cannot sign in because the reset link expired.",
        sourceIds: ["m1", "m3"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
    expect(result.structural.eligible).toBe(true);
    expect(result.semantic.supported).toBe(true);
  });

  it("blocks summaries with invalid citations", () => {
    const result = evaluateReleaseCandidate(
      {
        summary: "Customer cannot sign in.",
        sourceIds: ["m999"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.structural.eligible).toBe(false);
    expect(result.reasons).toContain(
      "One or more citations do not belong to this ticket."
    );
  });

  it("blocks semantically unsupported claims", () => {
    const result = evaluateReleaseCandidate(
      {
        summary: "The payment gateway is unavailable.",
        sourceIds: ["m1", "m3"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.structural.eligible).toBe(true);
    expect(result.semantic.supported).toBe(false);
    expect(result.reasons).toContain(
      "Unsupported claim: Payment gateway outage."
    );
  });

  it("combines structural and semantic failures", () => {
    const result = evaluateReleaseCandidate(
      {
        summary: "The payment gateway is unavailable.",
        sourceIds: ["m999"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.structural.eligible).toBe(false);
    expect(result.semantic.supported).toBe(false);
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });
});