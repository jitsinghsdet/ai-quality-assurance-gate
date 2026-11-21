
import { describe, expect, it } from "vitest";
import { evaluateSemanticSupport } from "../src/semanticRules";
import { currentTicket } from "../src/ticket";

describe("semantic evidence evaluation", () => {
    it("accepts claims supported by cited ticket messages", () => {
        const result = evaluateSemanticSupport(
            "Customer cannot sign in because the reset link expired.",
            currentTicket,
            ["m1", "m3"]
        );

        expect(result.supported).toBe(true);
        expect(result.unsupportedClaims).toHaveLength(0);
    });

    it("rejects an unsupported payment gateway claim", () => {
        const result = evaluateSemanticSupport(
            "Customer cannot sign in because the payment gateway is unavailable.",
            currentTicket,
            ["m1", "m3"]
        );

        expect(result.supported).toBe(false);
        expect(result.unsupportedClaims).toContain(
            "Payment gateway outage"
        );
    });

    it("rejects an unsupported account locked claim", () => {
        const result = evaluateSemanticSupport(
            "The customer's account is locked.",
            currentTicket,
            ["m1", "m3"]
        );

        expect(result.supported).toBe(false);
        expect(result.unsupportedClaims).toContain("Account locked");
    });

    it("rejects unsupported failed login attempt counts", () => {
        const result = evaluateSemanticSupport(
            "Customer experienced three failed login attempts.",
            currentTicket,
            ["m1", "m3"]
        );

        expect(result.supported).toBe(false);
        expect(result.unsupportedClaims).toContain(
            "Three failed login attempts"
        );
    });

    it("does not use uncited messages as supporting evidence", () => {
        const result = evaluateSemanticSupport(
            "Customer cannot sign in because the reset link expired.",
            currentTicket,
            ["m1"]
        );

        expect(result.supported).toBe(false);
        expect(result.unsupportedClaims).toContain("Reset link expiration");
    });

    it("accepts summaries without unsupported known claims", () => {
        const result = evaluateSemanticSupport(
            "Customer reported an issue accessing the account.",
            currentTicket,
            ["m1"]
        );

        expect(result.supported).toBe(true);
    });


    it("rejects unsupported claims while accepting supported claims", () => {
        const result = evaluateSemanticSupport(
            "The reset link expired and the payment gateway is unavailable.",
            currentTicket,
            ["m1", "m3"]
        );

        expect(result.supported).toBe(false);
        expect(result.unsupportedClaims).toContain("Payment gateway outage");
        expect(result.unsupportedClaims).not.toContain("Reset link expiration");
    });

    it("identifies multiple unsupported claims in one summary", () => {
        const result = evaluateSemanticSupport(
            "The account is locked and the payment gateway is unavailable.",
            currentTicket,
            ["m1", "m3"]
        );

        expect(result.supported).toBe(false);
        expect(result.unsupportedClaims).toContain("Account locked");
        expect(result.unsupportedClaims).toContain("Payment gateway outage");
        expect(result.unsupportedClaims).toHaveLength(2);
    });

});