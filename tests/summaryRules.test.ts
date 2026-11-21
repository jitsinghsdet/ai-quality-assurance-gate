
import { describe, expect, it } from "vitest";
import { evaluateSummary } from "../src/summaryRules";
import { currentTicket } from "../src/ticket";

describe("deterministic summary evaluation", () => {
  it("accepts a concise summary with valid current-ticket citations", () => {
    const result = evaluateSummary(
      {
        summary: "Customer cannot sign in because the reset link expired.",
        sourceIds: ["m1", "m3"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("rejects missing citations", () => {
    const result = evaluateSummary(
      {
        summary: "Customer cannot sign in.",
        sourceIds: []
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "At least one source citation is required."
    );
  });

  it("rejects citations belonging to another ticket", () => {
    const result = evaluateSummary(
      {
        summary: "Customer cannot sign in.",
        sourceIds: ["m999"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "One or more citations do not belong to this ticket."
    );
  });

  it("rejects duplicate source citations", () => {
    const result = evaluateSummary(
      {
        summary: "Customer cannot sign in.",
        sourceIds: ["m1", "m1"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "Duplicate source citations are not allowed."
    );
  });

  it("rejects invalid source ID types", () => {
    const result = evaluateSummary(
      {
        summary: "Customer cannot sign in.",
        sourceIds: ["m1", 123]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "One or more source IDs have an invalid format."
    );
  });

  it("rejects empty or whitespace-only source IDs", () => {
    const result = evaluateSummary(
      {
        summary: "Customer cannot sign in.",
        sourceIds: ["m1", "   "]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "Source IDs cannot be empty."
    );
  });

  it("rejects summaries containing email addresses or phone-like data", () => {
    const result = evaluateSummary(
      {
        summary: "Contact customer at alex@example.com about the reset.",
        sourceIds: ["m1"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "Summary may expose personal contact information."
    );
  });

  it("rejects empty wording even when a valid source is present", () => {
    const result = evaluateSummary(
      {
        summary: "  ",
        sourceIds: ["m1"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "Summary is missing or empty."
    );
  });

  it("rejects malformed summary content", () => {
    const result = evaluateSummary(
      {
        summary: 123,
        sourceIds: ["m1"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "Summary is missing or empty."
    );
  });

  it("reports multiple validation failures together", () => {
    const result = evaluateSummary(
      {
        summary: "",
        sourceIds: ["m999", "m999"]
      },
      currentTicket
    );

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      "Summary is missing or empty."
    );
    expect(result.reasons).toContain(
      "Duplicate source citations are not allowed."
    );
    expect(result.reasons).toContain(
      "One or more citations do not belong to this ticket."
    );
  });
});